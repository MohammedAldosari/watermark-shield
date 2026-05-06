/**
 * Stable inline-style fragments emitted by `watermark-js-plus` on its
 * overlay element. Used to build a CSS attribute-selector that targets
 * the overlay reliably across library versions.
 *
 * Treat this list as a contract with the underlying library; if the
 * library changes its inline style format, this list needs updating.
 */
export const WATERMARK_OVERLAY_SIGNATURE = [
  'z-index: 2147483647',
  'pointer-events: none',
  'position: fixed',
  'print-color-adjust: exact',
  'background-repeat: repeat',
  'display: block',
  'visibility: visible',
] as const;
