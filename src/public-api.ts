/*
 * Public API of `watermark-shield` — the framework-agnostic core.
 *
 * Framework-specific bindings live in their own sub-path entries:
 *
 *   import { WatermarkShieldService } from 'watermark-shield/angular';
 *   import { useWatermarkShield }     from 'watermark-shield/react';
 *   import { useWatermarkShield }     from 'watermark-shield/vue';
 */
export { WatermarkShield } from './lib/core/watermark-shield.core';
export type { WatermarkShieldOptions, ShieldProtections } from './lib/core/types';
export { DEFAULT_PROTECTIONS, DEFAULT_SPACE_BETWEEN } from './lib/core/types';
export type { ColorPair } from './lib/core/color-resolver';
