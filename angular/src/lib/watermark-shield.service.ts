import { Injectable, OnDestroy } from '@angular/core';

import { WatermarkShield, type WatermarkShieldOptions } from 'watermark-shield';

/**
 * Angular service wrapping {@link WatermarkShield}. Provided in root by
 * default — inject it from any component, route guard, or interceptor.
 *
 * Method names mirror the underlying class (`create` / `update` /
 * `destroy`) so consumers can swap between the framework-agnostic API
 * and the Angular service without re-learning method names.
 *
 * Only one watermark instance per page is supported; subsequent calls
 * to {@link create} are no-ops until the existing instance is destroyed.
 */
@Injectable({ providedIn: 'root' })
export class WatermarkShieldService implements OnDestroy {
  private shield: WatermarkShield | null = null;

  /**
   * Mounts the watermark with the given options. No-op if a watermark
   * is already mounted; call {@link destroy} first to remount with new
   * options, or use {@link update} to change content in place.
   */
  create(options: WatermarkShieldOptions): void {
    if (this.shield) return;
    this.shield = new WatermarkShield(options);
    this.shield.create();
  }

  /**
   * Updates the active watermark's options (typically used to swap the
   * displayed user identifier). Has no effect if {@link create} has not
   * been called.
   */
  update(patch: Partial<WatermarkShieldOptions>): void {
    this.shield?.update(patch);
  }

  /**
   * Tears down the watermark. Page-level hardening (DevTools guard,
   * prototype freeze) remains installed.
   */
  destroy(): void {
    this.shield?.destroy();
    this.shield = null;
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
