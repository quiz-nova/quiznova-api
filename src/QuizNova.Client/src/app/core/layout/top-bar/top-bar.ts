import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { AuthService } from '@Features/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';

import { LanguageSelector } from '@shared/components/language-selector/language-selector';

@Component({
  selector: 'qn-top-bar',
  imports: [Button, LanguageSelector, TranslatePipe],
  template: `
    <header class="dashboard-top-bar">
      <button
        class="dashboard-top-bar__menu-btn focus-green-ring"
        [attr.aria-expanded]="isSidebarOpen()"
        [attr.aria-label]="
          isSidebarOpen()
            ? (tokens.COMMON.CLOSE_MENU | translate)
            : (tokens.COMMON.OPEN_MENU | translate)
        "
        (click)="toggleMenu.emit()"
        type="button"
        aria-controls="main-sidebar"
      >
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>

      <div class="dashboard-top-bar__actions">
        <qn-language-selector />
        <p-button
          [outlined]="true"
          [label]="tokens.NAV.LOGOUT | translate"
          [attr.aria-label]="tokens.NAV.LOGOUT | translate"
          (onClick)="onLogout()"
          icon="fa-solid fa-right-from-bracket"
          severity="secondary"
          type="button"
        />
      </div>
    </header>
  `,
  styleUrl: './top-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly tokens = TRANSLATION_TOKENS;

  readonly isSidebarOpen = input.required<boolean>();
  toggleMenu = output<void>();

  onLogout(): void {
    this.authService.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
