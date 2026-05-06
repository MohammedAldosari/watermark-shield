import { WATERMARK_OVERLAY_SIGNATURE } from './watermark-signature';

const STYLE_ELEMENT_ID = 'watermark-shield-opacity';

/**
 * Builds a CSS selector that targets the watermark overlay with high
 * specificity. Each signature fragment becomes an `[style*="..."]`
 * attribute selector; combined they uniquely identify the overlay.
 */
function buildOverlaySelector(): string {
  const attributeSelectors = WATERMARK_OVERLAY_SIGNATURE.map(
    (fragment) => `[style*="${fragment}"]`,
  ).join('');
  return `body div${attributeSelectors}`;
}

/**
 * Locks the `disabled` flag on the given style element so it cannot be
 * toggled off via the obvious `getElementById(...).disabled = true` route.
 *
 * Best-effort: some non-browser environments may not allow redefinition,
 * which is fine — the lock is a hardening measure, not a correctness
 * requirement.
 */
function lockStyleElementDisabled(style: HTMLStyleElement): void {
  try {
    Object.defineProperty(style, 'disabled', {
      value: false,
      writable: false,
      configurable: false,
    });
  } catch {
    // Non-browser or locked-down environment — proceed without the lock.
  }
}

/**
 * Mounts a stylesheet that pins the watermark overlay's `opacity` to the
 * given value. Returns a disposer that removes the stylesheet.
 *
 * Default opacity of `1` is correct for almost all callers: the watermark
 * library already controls the overlay's visual transparency through its
 * canvas alpha. CSS `opacity` here is purely about preventing the overlay
 * from being made fully transparent by external CSS.
 */
export function enforceOpacity(opacity = 1): () => void {
  if (typeof document === 'undefined') {
    return () => {
      /* no-op outside the browser */
    };
  }

  document.getElementById(STYLE_ELEMENT_ID)?.remove();

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `${buildOverlaySelector()} { opacity: ${opacity} !important; }`;
  document.head.appendChild(style);

  lockStyleElementDisabled(style);

  return () => style.remove();
}
