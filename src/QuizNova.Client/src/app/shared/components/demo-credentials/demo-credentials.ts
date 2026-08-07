import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'qn-demo-credentials',
  standalone: true,
  template: `
    <div class="demo-credentials">
      <p class="demo-note">
        <i class="fa-solid fa-lock"></i> <strong>Shh… Secret Passwords!</strong> Don't tell anyone!
      </p>
      <div class="credential-row">
        <span class="cred-role"><i class="fa-solid fa-crown"></i> Admin</span>
        <span class="cred-value">
          admin@quiznova.local /
          @if (visible() !== 'admin') {
            <button class="reveal-btn" (click)="reveal('admin')" type="button">
              <i class="fa-solid fa-eye"></i> Reveal
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
        <span class="cred-role"><i class="fa-solid fa-chalkboard-user"></i> Instructor</span>
        <span class="cred-value">
          ahmed.nasser@quiznova.local /
          @if (visible() !== 'instructor') {
            <button class="reveal-btn" (click)="reveal('instructor')" type="button">
              <i class="fa-solid fa-eye"></i> Reveal
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
        <span class="cred-role"><i class="fa-solid fa-graduation-cap"></i> Student</span>
        <span class="cred-value">
          omar.yasser@quiznova.local /
          @if (visible() !== 'student') {
            <button class="reveal-btn" (click)="reveal('student')" type="button">
              <i class="fa-solid fa-eye"></i> Reveal
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
  protected readonly visible = signal<string | null>(null);

  protected reveal(key: string): void {
    this.visible.set(key);
  }

  protected hide(): void {
    this.visible.set(null);
  }
}
