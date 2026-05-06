import { useEffect, useRef } from 'react';

import { WatermarkShield, type WatermarkShieldOptions } from 'watermark-shield';

/**
 * Imperative handle returned by {@link useWatermarkShield}. Use `update`
 * to swap the displayed identity (e.g. when the user logs in or out)
 * without tearing down the watermark.
 */
export interface WatermarkShieldHandle {
  update: (patch: Partial<WatermarkShieldOptions>) => void;
}

/**
 * Mounts a hardened watermark on the page for the lifetime of the
 * component that calls this hook. The watermark is created on first
 * mount and destroyed when the component unmounts.
 *
 * Call this from your app's root component so the watermark stays
 * mounted for the entire session.
 *
 * The `initialOptions` argument is captured once on mount; later
 * renders do not re-create the watermark. To change the displayed
 * identity, call the returned `update` function.
 *
 * @example
 *   function App() {
 *     useWatermarkShield({
 *       content: '🛡️ ' + currentUser.email,
 *       fontColor: { light: '#000', dark: '#fff' },
 *       protect: { devtool: true },
 *     });
 *     return <Routes>...</Routes>;
 *   }
 */
export function useWatermarkShield(initialOptions: WatermarkShieldOptions): WatermarkShieldHandle {
  const shieldRef = useRef<WatermarkShield | null>(null);
  const optionsRef = useRef(initialOptions);
  optionsRef.current = initialOptions;

  useEffect(() => {
    const shield = new WatermarkShield(optionsRef.current);
    shield.create();
    shieldRef.current = shield;
    return () => {
      shield.destroy();
      shieldRef.current = null;
    };
    // The watermark is created once per component mount. Option changes
    // are propagated explicitly via the returned `update` function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    update: (patch) => shieldRef.current?.update(patch),
  };
}
