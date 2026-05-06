import type DisableDevtoolType from 'disable-devtool';

import type { ShieldProtections } from './types';

type DisableDevtoolFn = typeof DisableDevtoolType;
type DisableDevtoolConfig = Parameters<DisableDevtoolFn>[0];

/**
 * Module-scoped state. The underlying `disable-devtool` library is itself
 * a singleton — installing it twice is wasteful and can cause duplicated
 * detection callbacks — so we gate installation here.
 */
let isInstalled = false;

/**
 * Dynamically imports `disable-devtool` and unwraps its default export.
 * Centralised so the awkward CJS/ESM interop only has to be maintained
 * in one place.
 */
async function loadDisableDevtool(): Promise<DisableDevtoolFn> {
  const mod = await import('disable-devtool');
  return mod.default ?? (mod as unknown as DisableDevtoolFn);
}

function buildDisableDevtoolConfig(opts: ShieldProtections): DisableDevtoolConfig {
  const config: DisableDevtoolConfig = {
    disableMenu: opts.disableMenu ?? false,
    ondevtoolopen: (detectorType, navigateAway) => {
      try {
        opts.onDevtoolOpen?.(detectorType as unknown as number);
      } finally {
        navigateAway();
      }
    },
  };
  if (opts.devtoolUrl) {
    (config as DisableDevtoolConfig & { url?: string }).url = opts.devtoolUrl;
  }
  return config;
}

/**
 * Activates the DevTools guard once per page. No-op if `protect.devtool`
 * is falsy, the guard is already installed, or the runtime isn't a
 * browser.
 */
export async function installDevtoolGuard(opts: ShieldProtections): Promise<void> {
  if (isInstalled) return;
  if (!opts.devtool) return;
  if (typeof window === 'undefined') return;

  const DisableDevtool = await loadDisableDevtool();
  DisableDevtool(buildDisableDevtoolConfig(opts));
  isInstalled = true;
}

/**
 * Suspends or resumes the guard at runtime — useful for admin overrides
 * or test environments. Has no effect if the guard was never installed.
 */
export async function suspendDevtoolGuard(suspend: boolean): Promise<void> {
  if (!isInstalled) return;
  if (typeof window === 'undefined') return;

  const DisableDevtool = await loadDisableDevtool();
  const withSuspend = DisableDevtool as DisableDevtoolFn & { isSuspend?: boolean };
  if ('isSuspend' in withSuspend) withSuspend.isSuspend = suspend;
}
