import type { WatermarkOptions } from 'watermark-js-plus';

import type { ColorPair } from './color-resolver';

/**
 * Toggles for the optional, configurable hardening features.
 *
 * Note: two passive protections — opacity enforcement and the
 * MutationObserver prototype lock — are always active and **not**
 * exposed here. They have no UX impact and there is no legitimate
 * reason to disable them.
 *
 * Defaults are defined in {@link DEFAULT_PROTECTIONS}.
 */
export interface ShieldProtections {
  /**
   * Activate the DevTools guard. When enabled, the page redirects the
   * user away as soon as DevTools is detected. Disabled by default.
   */
  devtool?: boolean;

  /**
   * Whether the right-click context menu should be disabled when
   * `devtool` is on. Default: `false` — the right-click menu stays
   * available so end users see no UX change.
   */
  disableMenu?: boolean;

  /** URL to redirect the user to when DevTools is detected. */
  devtoolUrl?: string;

  /**
   * Optional callback fired when DevTools is detected. Useful for
   * sending a server-side audit log entry.
   */
  onDevtoolOpen?: (detectorType: number) => void;

  /**
   * Activate an aggressive anti-tamper trap that pauses the page on a
   * `debugger` statement when DevTools is open. Hostile UX — opt in
   * only when the friction is acceptable.
   */
  debuggerLoop?: boolean;
}

/** Default gap (in CSS pixels) between repeating watermark tiles. */
export const DEFAULT_SPACE_BETWEEN = 80;

/**
 * Public configuration object for {@link WatermarkShield}. Extends every
 * option supported by `watermark-js-plus` and adds the `protect` block.
 *
 * Notable differences from the underlying engine:
 *
 * - `width` and `height` are **not exposed**. Tile dimensions are
 *   computed automatically from `content`, `fontSize`, `fontFamily`,
 *   `fontWeight`, `rotate` and `spaceBetween`, so the watermark text
 *   always renders at its natural aspect ratio regardless of length.
 * - `parent` accepts a CSS selector string in addition to an element.
 * - `fontColor` accepts a `{ light, dark }` pair which auto-resolves
 *   from the browser's `prefers-color-scheme` and re-resolves whenever
 *   the user toggles their system theme.
 */
export type WatermarkShieldOptions = Partial<
  Omit<WatermarkOptions, 'parent' | 'fontColor' | 'fontSize' | 'width' | 'height'>
> & {
  /** Watermark text — typically the current user's id, email or username. */
  content: string;
  /**
   * Font size. Accepts:
   *   - a raw number, treated as pixels (`18`)
   *   - a CSS length string with one of these units:
   *     `'18px'`, `'4vw'`, `'4vh'`, `'3vmin'`, `'3vmax'`, `'1.2rem'`, `'1.2em'`
   *
   * Viewport-relative units (`vw`, `vh`, `vmin`, `vmax`) are resolved
   * against the current viewport at create time and re-resolve
   * automatically when the user resizes their browser, so the watermark
   * stays the same fraction of the screen across devices and zoom
   * levels. Use `vw`/`vh` instead of fixed `px` if you want the
   * watermark to look consistent on small laptops and 4K monitors.
   */
  fontSize?: number | string;
  /** Mount target. Defaults to `document.body`. */
  parent?: HTMLElement | string;
  /**
   * Watermark text colour. Pass a single CSS colour string for a fixed
   * colour, or a `{ light, dark }` pair to have the shield pick the
   * right colour based on the user's system theme and update
   * automatically when the theme changes.
   */
  fontColor?: string | ColorPair;
  /**
   * Gap in CSS pixels between repeating watermark tiles. Larger values
   * make the watermark sparser; smaller values make it denser and
   * harder to crop out. Defaults to {@link DEFAULT_SPACE_BETWEEN}.
   */
  spaceBetween?: number;
  /** Optional hardening features layered on top of the watermark. */
  protect?: ShieldProtections;
};

/**
 * Default values for the configurable protections. Both active layers
 * (`devtool` and `debuggerLoop`) are opt-in.
 */
export const DEFAULT_PROTECTIONS: Required<
  Pick<ShieldProtections, 'disableMenu' | 'debuggerLoop' | 'devtool'>
> = {
  devtool: false,
  disableMenu: false,
  debuggerLoop: false,
};
