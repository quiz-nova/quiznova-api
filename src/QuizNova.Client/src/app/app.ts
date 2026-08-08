import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_SETTINGS } from '@Core/config/app.settings';
import { TranslateService } from '@ngx-translate/core';
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
export class App implements OnInit {
  private readonly appSettings = inject(APP_SETTINGS);
  private readonly translate = inject(TranslateService);
  protected readonly title = signal(this.appSettings.appName);
  ngOnInit(): void {
    this.translate.use('en');
  }
  changeLanguage(lang: string): void {
    this.translate.use(lang);
  }
}
