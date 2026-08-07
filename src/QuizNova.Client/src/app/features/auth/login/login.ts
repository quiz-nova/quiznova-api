import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  type FormControl,
  type FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';

import { DEFAULT_USER_ROUTE, ROLES } from '@Core/config/role.config';
import { AuthService } from '@Features/auth/auth.service';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';

import { DemoCredentials } from '@shared/components/demo-credentials/demo-credentials';
import { FieldError } from '@shared/components/field-error/field-error';
import { Logo } from '@shared/components/logo/logo';
import { UserRole } from '@shared/models/users/user-role.model';
import { User } from '@shared/models/users/user.model';

type LoginFormGroup = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
  role: FormControl<UserRole>;
}>;

@Component({
  selector: 'qn-login',
  imports: [
    ReactiveFormsModule,
    Logo,
    DemoCredentials,
    FloatLabel,
    InputText,
    Password,
    FieldError,
    Button,
  ],
  template: `
    <section class="auth-page">
      <div class="auth-left-side">
        <div class="side-content">
          <qn-logo />
          <h2>Welcome back</h2>
          <p>
            Access your dashboard, manage quizzes, and track student performance - all in one place.
          </p>

          <qn-demo-credentials />
        </div>
      </div>

      <div class="auth-right-side">
        <qn-logo class="auth-logo"></qn-logo>
        <div class="auth-header">
          <h2>Sign in</h2>
          <p>Don't have an account? Contact Your Admin</p>
        </div>

        <form class="auth-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="auth-field">
            <p-floatlabel variant="on">
              <input
                id="login-email"
                [fluid]="true"
                [attr.aria-invalid]="emailControl.invalid && emailControl.touched ? 'true' : null"
                [formControl]="emailControl"
                pInputText
                type="email"
                autocomplete="username"
                aria-describedby="email-is-required-error please-enter-a-valid-email-address-error"
              />
              <label for="login-email">Email</label>
            </p-floatlabel>

            @if (emailControl.invalid && emailControl.touched) {
              @if (emailControl.hasError('required')) {
                <qn-field-error id="email-is-required-error">Email is required.</qn-field-error>
              } @else if (emailControl.hasError('email')) {
                <qn-field-error id="please-enter-a-valid-email-address-error"
                  >Please enter a valid email address.</qn-field-error
                >
              }
            }
          </div>
          <div class="auth-field">
            <p-floatlabel variant="on">
              <p-password
                [feedback]="false"
                [toggleMask]="true"
                [fluid]="true"
                [attr.aria-invalid]="
                  passwordControl.invalid && passwordControl.touched ? 'true' : null
                "
                [formControl]="passwordControl"
                inputId="login-password"
                autocomplete="current-password"
                aria-describedby="password-is-required-error"
              />
              <label for="login-password">Password</label>
            </p-floatlabel>

            @if (passwordControl.invalid && passwordControl.touched) {
              @if (passwordControl.hasError('required')) {
                <qn-field-error id="password-is-required-error"
                  >Password is required.</qn-field-error
                >
              }
            }
          </div>
          <fieldset class="roles-group">
            <legend class="sr-only">Select your account role</legend>
            <div class="roles">
              @for (role of userRoles; track role.id) {
                <label class="role-box">
                  <input [value]="role.value" [formControl]="roleControl" type="radio" />
                  <span>{{ role.label }}</span>
                </label>
              }
            </div>
          </fieldset>
          <p-button
            [disabled]="loginForm.invalid"
            [loading]="isLogging()"
            [label]="isLogging() ? 'Signing in...' : 'Sign in'"
            severity="success"
            styleClass="auth-submit"
            type="submit"
          />
        </form>
      </div>
    </section>
  `,
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly userRoles = ROLES;
  protected readonly isLogging = signal(false);
  private readonly messageService = inject(MessageService);

  protected readonly loginForm: LoginFormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    role: [UserRole.student, [Validators.required]],
  });

  protected get emailControl() {
    return this.loginForm.controls.email;
  }
  protected get passwordControl() {
    return this.loginForm.controls.password;
  }
  protected get roleControl() {
    return this.loginForm.controls.role;
  }
  onSubmit(): void {
    this.isLogging.set(true);
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (user: User) => {
        const route = DEFAULT_USER_ROUTE[user.role];
        this.router.navigate([route]);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: 'The login information you entered is incorrect.',
        });
        this.isLogging.set(false);
      },
    });
  }
}
