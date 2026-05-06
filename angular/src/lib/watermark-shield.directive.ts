import {
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';

import type { WatermarkShieldOptions } from 'watermark-shield';

import { WatermarkShieldService } from './watermark-shield.service';

/**
 * Lifecycle-bound wrapper around {@link WatermarkShieldService}.
 *
 * Mount the directive on any element to scope the watermark to that
 * element's lifetime — when the host is destroyed, the watermark is
 * torn down.
 *
 * @example
 *   <main [wmShield]="{ content: user.email, protect: { devtool: true } }">
 *     <!-- sensitive content -->
 *   </main>
 */
@Directive({
  selector: '[wmShield]',
  standalone: true,
})
export class WatermarkShieldDirective implements OnInit, OnChanges, OnDestroy {
  @Input({ alias: 'wmShield', required: true })
  options!: WatermarkShieldOptions;

  private readonly service = inject(WatermarkShieldService);

  ngOnInit(): void {
    this.service.create(this.options);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && !changes['options'].firstChange) {
      this.service.update(this.options);
    }
  }

  ngOnDestroy(): void {
    this.service.destroy();
  }
}
