import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'qn-demo-credentials',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="demo-credentials">
      <p class="demo-note">
        <i class="fa-solid fa-lock"></i> <strong>{{ tokens.AUTH.DEMO_NOTE | translate }}</strong>
      </p>
      <div class="credential-row">
        <span class="cred-role"
          ><i class="fa-solid fa-crown"></i> {{ tokens.ROLES.ADMIN | translate }}</span
        >
        <span class="cred-value">
          admin@quiznova.local /
          @if (visible() !== 'admin') {
            <button class="reveal-btn" (click)="reveal('admin')" type="button">
              <i class="fa-solid fa-eye"></i> {{ tokens.AUTH.REVEAL_PASSWORDS | translate }}
            </button>
          } @else {
            <button class="reveal-btn revealed" (click)="hide()" type="button">
              <i class="fa-solid fa-eye-slash"></i>
            </button>
            <span class="cred-password">Admin123!</span>
          }
        </span>
      </div>
      <div class="credential-row">
        <span class="cred-role"
          ><i class="fa-solid fa-chalkboard-user"></i>
          {{ tokens.ROLES.INSTRUCTOR | translate }}</span
        >
        <span class="cred-value">
          ahmed.nasser@quiznova.local /
          @if (visible() !== 'instructor') {
            <button class="reveal-btn" (click)="reveal('instructor')" type="button">
              <i class="fa-solid fa-eye"></i> {{ tokens.AUTH.REVEAL_PASSWORDS | translate }}
            </button>
          } @else {
            <button class="reveal-btn revealed" (click)="hide()" type="button">
              <i class="fa-solid fa-eye-slash"></i>
            </button>
            <span class="cred-password">Instructor123!</span>
          }
        </span>
      </div>
      <div class="credential-row">
        <span class="cred-role"
          ><i class="fa-solid fa-graduation-cap"></i> {{ tokens.ROLES.STUDENT | translate }}</span
        >
        <span class="cred-value">
          omar.yasser@quiznova.local /
          @if (visible() !== 'student') {
            <button class="reveal-btn" (click)="reveal('student')" type="button">
              <i class="fa-solid fa-eye"></i> {{ tokens.AUTH.REVEAL_PASSWORDS | translate }}
            </button>
          } @else {
            <button class="reveal-btn revealed" (click)="hide()" type="button">
              <i class="fa-solid fa-eye-slash"></i>
            </button>
            <span class="cred-password">Student123!</span>
          }
        </span>
      </div>
    </div>
  `,
  styleUrl: './demo-credentials.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoCredentials {
  protected readonly tokens = TRANSLATION_TOKENS;
  protected readonly visible = signal<string | null>(null);

  protected reveal(key: string): void {
    this.visible.set(key);
  }

  protected hide(): void {
    this.visible.set(null);
  }
}
