import { Watermark, type WatermarkOptions } from 'watermark-js-plus';

import { resolveColor, subscribeToColorScheme } from './color-resolver';
import { startDebuggerLoop } from './debugger-loop';
import { installDevtoolGuard } from './devtool-guard';
import { enforceOpacity } from './opacity-enforcer';
import { freezeMutationObserverPrototype } from './observer-freezer';
import { computeTileSize } from './tile-size';
import {
  DEFAULT_PROTECTIONS,
  DEFAULT_SPACE_BETWEEN,
  type ShieldProtections,
  type WatermarkShieldOptions,
} from './types';

/** watermark-js-plus default for `fontSize`. Used when the caller hasn't set one. */
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FAMILY = 'sans-serif';
const DEFAULT_FONT_WEIGHT = 'normal';
const DEFAULT_ROTATE = -22;

/**
 * Resolves `fontSize` to a raw pixel number. Accepts:
 *   - a number (treated as px)
 *   - `'<n>px'`
 *   - `'<n>vw'`, `'<n>vh'`, `'<n>vmin'`, `'<n>vmax'` (resolved against
 *     the current viewport)
 *   - `'<n>rem'` (resolved against the document root font-size)
 *   - `'<n>em'`  (resolved against `document.body`'s font-size)
 *
 * Viewport-relative units make the watermark size scale with the
 * user's actual screen, instead of being a fixed pixel value that can
 * look tiny on big screens or huge on small ones.
 *
 * Returns `fallback` outside the browser (SSR) or for unrecognised
 * units, so callers don't need to special-case the SSR path.
 */
function toFontSize(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return fallback;

  const match = /^\s*([\d.]+)\s*(px|vw|vh|vmin|vmax|rem|em)?\s*$/i.exec(value);
  if (!match) return fallback;
  const [, num, rawUnit] = match;
  const n = parseFloat(num);
  if (!Number.isFinite(n)) return fallback;
  const unit = rawUnit?.toLowerCase() ?? 'px';

  // SSR / non-DOM: only `px` is meaningful; everything else falls back.
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return unit === 'px' ? n : fallback;
  }

  switch (unit) {
    case 'vw':   return (n * window.innerWidth) / 100;
    case 'vh':   return (n * window.innerHeight) / 100;
    case 'vmin': return (n * Math.min(window.innerWidth, window.innerHeight)) / 100;
    case 'vmax': return (n * Math.max(window.innerWidth, window.innerHeight)) / 100;
    case 'rem':  return n * parseFloat(getComputedStyle(document.documentElement).fontSize);
    case 'em':   return n * parseFloat(getComputedStyle(document.body).fontSize);
    case 'px':
    default:     return n;
  }
}

/**
 * Hardened wrapper around `watermark-js-plus`. Mounts the underlying
 * watermark and applies the requested browser-side protections.
 *
 * Framework-agnostic — usable from any web app. Angular consumers can
 * additionally use `WatermarkShieldService` and `WatermarkShieldDirective`
 * for ergonomics.
 *
 * @example
 *   const shield = new WatermarkShield({
 *     content: currentUserId,
 *     globalAlpha: 0.18,
 *     fontColor: { light: '#000', dark: '#fff' },
 *     protect: { devtool: true },
 *   });
 *   shield.create();
 *   // ...later
 *   shield.update({ content: newUserId });
 *   shield.destroy();
 */
export class WatermarkShield {
  private options: WatermarkShieldOptions;
  private watermark: Watermark | null = null;
  private opacityDisposer: (() => void) | null = null;
  private colorSchemeDisposer: (() => void) | null = null;
  private resizeListener: (() => void) | null = null;

  constructor(options: WatermarkShieldOptions) {
    // Take a shallow copy so subsequent `update()` calls don't mutate
    // the caller's input object.
    this.options = { ...options };
  }

  /**
   * Mounts the watermark and installs every protection layer. No-op if
   * already created.
   *
   * Two passive protections — opacity enforcement and the
   * MutationObserver prototype lock — are always applied because they
   * have no UX cost and no reason to be disabled. The configurable
   * protections (`devtool`, `debuggerLoop`) are opt-in via
   * {@link ShieldProtections}.
   */
  create(): void {
    if (this.watermark) return;

    const protections = this.resolveProtections();

    // Page-level active protections (opt-in).
    if (protections.debuggerLoop) startDebuggerLoop();
    if (protections.devtool) void installDevtoolGuard(protections);

    this.watermark = new Watermark(this.toWatermarkOptions());
    this.watermark.create();

    // If the caller supplied a light/dark colour pair, keep the watermark
    // in sync with the browser's `prefers-color-scheme` setting.
    this.colorSchemeDisposer = subscribeToColorScheme(
      this.options.fontColor,
      (color) => this.applyResolvedColor(color),
    );

    // Always-on passive protections.
    this.opacityDisposer = enforceOpacity();

    // Re-resolve viewport-relative font sizes (vw, vh, vmin, vmax) when
    // the browser viewport changes. No-op for fixed px sizes since the
    // recomputed options are identical, but cheap enough to leave on.
    if (typeof window !== 'undefined') {
      this.resizeListener = () => {
        void this.watermark?.changeOptions(this.toWatermarkOptions());
      };
      window.addEventListener('resize', this.resizeListener);
    }

    // Prototype-level locks run last so every observer set up above
    // (the watermark library's and our own) is in place before we make
    // the prototype methods immutable.
    freezeMutationObserverPrototype();
  }

  /**
   * Updates watermark options (e.g. swaps the displayed user) without
   * tearing down the page-level protections.
   */
  update(patch: Partial<WatermarkShieldOptions>): void {
    this.options = { ...this.options, ...patch };

    // If `fontColor` itself changed, replace the colour-scheme listener
    // so it tracks the new value going forward.
    if (Object.prototype.hasOwnProperty.call(patch, 'fontColor')) {
      this.colorSchemeDisposer?.();
      this.colorSchemeDisposer = subscribeToColorScheme(
        this.options.fontColor,
        (color) => this.applyResolvedColor(color),
      );
    }

    // `changeOptions` is async on the underlying lib but we don't expose
    // that detail — callers that want to await the visual refresh can
    // call the underlying method themselves.
    void this.watermark?.changeOptions(this.toWatermarkOptions());
  }

  /**
   * Tears down the watermark and releases per-instance resources.
   *
   * Page-level protections (DevTools guard, prototype freeze) are kept
   * deliberately: they are idempotent and removing them would weaken any
   * other watermark shields running on the same page.
   */
  destroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
    this.resizeListener = null;
    this.colorSchemeDisposer?.();
    this.colorSchemeDisposer = null;
    this.opacityDisposer?.();
    this.opacityDisposer = null;
    this.watermark?.destroy();
    this.watermark = null;
  }

  /**
   * Pushes a freshly-resolved theme colour through to the underlying
   * watermark while preserving every other option. The lib's
   * `changeOptions` replaces (not merges) the passed object, so we
   * always send the full option set.
   */
  private applyResolvedColor(color: string): void {
    if (!this.watermark) return;
    void this.watermark.changeOptions({ ...this.toWatermarkOptions(), fontColor: color });
  }

  private resolveProtections(): ShieldProtections {
    return { ...DEFAULT_PROTECTIONS, ...(this.options.protect ?? {}) };
  }

  private toWatermarkOptions(): WatermarkOptions {
    const { protect: _ignored, parent, fontColor, spaceBetween, ...passThrough } = this.options;
    const tile = this.computeTileDimensions(spaceBetween);
    return {
      ...passThrough,
      parent: this.resolveParent(parent),
      fontColor: resolveColor(fontColor),
      width: tile.width,
      height: tile.height,
    } as WatermarkOptions;
  }

  /**
   * Auto-computes the tile dimensions so the watermark text always
   * renders at its natural aspect ratio, regardless of length. The
   * caller controls density through {@link WatermarkShieldOptions.spaceBetween}
   * rather than picking pixel sizes.
   */
  private computeTileDimensions(spaceBetween: number | undefined): { width: number; height: number } {
    return computeTileSize({
      text: this.options.content,
      fontSize: toFontSize(this.options.fontSize, DEFAULT_FONT_SIZE),
      fontFamily: this.options.fontFamily ?? DEFAULT_FONT_FAMILY,
      fontWeight: this.options.fontWeight ?? DEFAULT_FONT_WEIGHT,
      rotateDeg: this.options.rotate ?? DEFAULT_ROTATE,
      spaceBetween: spaceBetween ?? DEFAULT_SPACE_BETWEEN,
    });
  }

  private resolveParent(parent: WatermarkShieldOptions['parent']): HTMLElement {
    if (parent instanceof HTMLElement) return parent;
    if (typeof parent === 'string') {
      const found = document.querySelector<HTMLElement>(parent);
      if (found) return found;
    }
    return document.body;
  }
}
