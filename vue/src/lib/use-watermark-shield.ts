import { onBeforeUnmount, onMounted } from 'vue';

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
 * component that calls this composable. The watermark is created on
 * `onMounted` and destroyed on `onBeforeUnmount`.
 *
 * Call this from your app's root component so the watermark stays
 * mounted for the entire session.
 *
 * @example
 *   <script setup lang="ts">
 *     import { useWatermarkShield } from 'watermark-shield/vue';
 *     import { useAuth } from './auth';
 *
 *     const { user } = useAuth();
 *     useWatermarkShield({
 *       content: '🛡️ ' + user.email,
 *       fontColor: { light: '#000', dark: '#fff' },
 *       protect: { devtool: true },
 *     });
 *   </script>
 */
export function useWatermarkShield(initialOptions: WatermarkShieldOptions): WatermarkShieldHandle {
  let shield: WatermarkShield | null = null;

  onMounted(() => {
    shield = new WatermarkShield(initialOptions);
    shield.create();
  });

  onBeforeUnmount(() => {
    shield?.destroy();
    shield = null;
  });

  return {
    update: (patch) => shield?.update(patch),
  };
}
