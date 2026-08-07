import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '@Features/auth/auth.service';
import { Button } from 'primeng/button';

@Component({
  selector: 'qn-top-bar',
  imports: [Button],
  template: `
    <header class="dashboard-top-bar">
      <button
        class="dashboard-top-bar__menu-btn focus-green-ring"
        [attr.aria-expanded]="isSidebarOpen()"
        (click)="toggleMenu.emit()"
        type="button"
        aria-label="Toggle sidebar"
        aria-controls="main-sidebar"
      >
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>

      <p-button
        [outlined]="true"
        (onClick)="onLogout()"
        aria-label="Logout"
        icon="fa-solid fa-right-from-bracket"
        label="Logout"
        severity="secondary"
        type="button"
      />
    </header>
  `,
  styleUrl: './top-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSidebarOpen = input.required<boolean>();
  toggleMenu = output<void>();

  onLogout(): void {
    this.authService.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
