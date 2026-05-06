import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WatermarkShieldService } from 'watermark-shield/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'watermark';
  private readonly shield = inject(WatermarkShieldService);

  ngAfterViewInit(): void {
    this.shield.create({
      content: '🛡️ watermark-shield',
      // Viewport-relative size: stays the same fraction of the screen
      // regardless of resolution, capture pipeline, or zoom level.
      fontSize: '1.5vw',
      fontWeight: 'bold',
      spaceBetween: 20,
      globalAlpha: 0.22,
      // Auto-pick a colour that contrasts with the user's system theme.
      // The shield re-resolves automatically when the user toggles light/dark.
      fontColor: { light: '#000000', dark: '#ffffff' },
      protect: {
        // Set `devtool: true` in production. Off here so headless preview
        // tooling doesn't trip the detector. `disableMenu: false` keeps the
        // browser's right-click menu enabled for end users.
        devtool: false,
        disableMenu: false,
        debuggerLoop: false,
      },
    });
  }

  ngOnDestroy(): void {
    this.shield.destroy();
  }
}
