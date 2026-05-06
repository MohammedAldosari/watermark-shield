/**
 * Tuple of two CSS colour strings — one for each system colour scheme.
 * The shield resolves to the matching value based on the browser's
 * `prefers-color-scheme` media query and re-resolves automatically when
 * the user toggles their OS / browser theme.
 */
export interface ColorPair {
  light: string;
  dark: string;
}

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export function isColorPair(value: unknown): value is ColorPair {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ColorPair).light === 'string' &&
    typeof (value as ColorPair).dark === 'string'
  );
}

/**
 * Returns the CSS colour appropriate for the current system theme.
 * Defaults to the `light` value when the runtime doesn't expose
 * `matchMedia` (older environments, SSR, headless test runners).
 */
export function resolveColor(value: string | ColorPair | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return value.light;
  }
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? value.dark : value.light;
}

/**
 * Subscribes to system-theme changes. The listener is invoked with the
 * fresh colour every time the user toggles light/dark mode at the OS
 * or browser level. Returns a disposer.
 *
 * If `value` is a plain string (no theme awareness needed) or the
 * runtime doesn't support `matchMedia`, this is a no-op.
 */
export function subscribeToColorScheme(
  value: string | ColorPair | undefined,
  onChange: (color: string) => void,
): () => void {
  if (value === undefined || !isColorPair(value)) return () => undefined;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);
  const handler = (event: MediaQueryListEvent) => {
    onChange(event.matches ? value.dark : value.light);
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}
