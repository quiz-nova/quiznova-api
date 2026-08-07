import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_SETTINGS } from '@Core/config/app.settings';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'qn-app',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly appSettings = inject(APP_SETTINGS);
  protected readonly title = signal(this.appSettings.appName);
}
