import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  type FormControl,
  type FormGroup,
} from '@angular/forms';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';

import { FieldError } from '@shared/components/field-error/field-error';
import { UserRole } from '@shared/models/users/user-role.model';
import { AdminService } from '@shared/services/admin.service';
import { CustomValidators } from '@shared/validators/custom-validators';

type AddAdminFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  phoneNumber: FormControl<string>;
  role: FormControl<UserRole>;
}>;

@Component({
  selector: 'qn-add-admin-modal',
  imports: [ReactiveFormsModule, FloatLabel, InputText, Password, Dialog, FieldError, Button],
  template: `
    <p-button (onClick)="openDialog()" label="Add Admin" severity="success" type="button" />

    <p-dialog
      [visible]="isDialogOpen()"
      [dismissableMask]="true"
      [modal]="true"
      [style]="{ width: 'min(40rem, 95vw)' }"
      (visibleChange)="onDialogVisibilityChange($event)"
      header="Add Admin"
    >
      <form class="add-form" [formGroup]="AddAdminForm" (ngSubmit)="onSubmit()">
        <div class="form-field">
          <p-floatlabel variant="on">
            <input
              id="admin-name"
              [fluid]="true"
              [attr.aria-invalid]="nameControl.invalid && nameControl.touched ? 'true' : null"
              [formControl]="nameControl"
              pInputText
              type="text"
              aria-describedby="name-is-required-error name-minlength-error"
            />
            <label for="admin-name">Name</label>
          </p-floatlabel>
          @if (nameControl.invalid && nameControl.touched) {
            @if (nameControl.hasError('required')) {
              <qn-field-error id="name-is-required-error">Name is required.</qn-field-error>
            }
            @if (nameControl.hasError('minlength')) {
              <qn-field-error id="name-minlength-error"
                >Name must be at least 3 characters.</qn-field-error
              >
            }
          }
        </div>

        <div class="form-field">
          <p-floatlabel variant="on">
            <input
              id="admin-email"
              [fluid]="true"
              [attr.aria-invalid]="emailControl.invalid && emailControl.touched ? 'true' : null"
              [formControl]="emailControl"
              pInputText
              type="email"
              aria-describedby="email-is-required-error please-enter-a-valid-email-address-error"
            />
            <label for="admin-email">Email</label>
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

        <div class="form-field">
          <p-floatlabel variant="on">
            <p-password
              [feedback]="false"
              [toggleMask]="true"
              [fluid]="true"
              [attr.aria-invalid]="
                passwordControl.invalid && passwordControl.touched ? 'true' : null
              "
              [formControl]="passwordControl"
              inputId="admin-password"
              aria-describedby="password-is-required-error password-minlength-error password-strong-error"
            />
            <label for="admin-password">Password</label>
          </p-floatlabel>
          @if (passwordControl.invalid && passwordControl.touched) {
            @if (passwordControl.hasError('required')) {
              <qn-field-error id="password-is-required-error">Password is required.</qn-field-error>
            }
            @if (passwordControl.hasError('minlength')) {
              <qn-field-error id="password-minlength-error"
                >Password must be at least 8 characters.</qn-field-error
              >
            }
            @if (passwordControl.hasError('strongPassword')) {
              <qn-field-error id="password-strong-error"
                >Password must contain uppercase, lowercase, number, and special
                character.</qn-field-error
              >
            }
          }
        </div>

        <div class="form-field">
          <p-floatlabel variant="on">
            <input
              id="admin-phone"
              [fluid]="true"
              [attr.aria-invalid]="
                phoneNumberControl.invalid && phoneNumberControl.touched ? 'true' : null
              "
              [formControl]="phoneNumberControl"
              pInputText
              type="text"
              aria-describedby="phone-number-is-required-error phone-minlength-error phone-maxlength-error"
            />
            <label for="admin-phone">Phone Number</label>
          </p-floatlabel>
          @if (phoneNumberControl.invalid && phoneNumberControl.touched) {
            <qn-field-error id="phone-number-is-required-error"
              >Phone number is required.</qn-field-error
            >
          }
        </div>

        @if (submitError()) {
          <p class="submit-error">Failed to create admin. Please check your input.</p>
        }

        @if (submitSuccess()) {
          <p class="submit-success">Admin created successfully.</p>
        }

        <div class="form-actions">
          <p-button
            [text]="true"
            (onClick)="closeDialog()"
            label="Cancel"
            severity="secondary"
            type="button"
          />
          <p-button
            [loading]="isSubmitting()"
            label="Save Admin"
            severity="success"
            type="submit"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styleUrl: './add-admin-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAdminModal {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminService = inject(AdminService);

  readonly created = output<void>();

  protected readonly isDialogOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal(false);
  protected readonly submitSuccess = signal(false);

  protected readonly AddAdminForm: AddAdminFormGroup = this.fb.group({
    name: ['', [Validators.required, CustomValidators.trimMinLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, CustomValidators.trimMinLength(8), CustomValidators.strongPassword()],
    ],
    phoneNumber: [
      '',
      [Validators.required, CustomValidators.trimMinLength(7), CustomValidators.trimMaxLength(15)],
    ],
    role: [UserRole.admin, [Validators.required]],
  });

  protected get nameControl() {
    return this.AddAdminForm.controls.name;
  }

  protected get emailControl() {
    return this.AddAdminForm.controls.email;
  }

  protected get passwordControl() {
    return this.AddAdminForm.controls.password;
  }

  protected get phoneNumberControl() {
    return this.AddAdminForm.controls.phoneNumber;
  }

  protected openDialog(): void {
    this.submitError.set(false);
    this.submitSuccess.set(false);
    this.isDialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.isDialogOpen.set(false);
    this.resetForm();
  }

  protected onDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.closeDialog();
    } else {
      this.isDialogOpen.set(true);
    }
  }

  protected resetForm(): void {
    this.AddAdminForm.reset({
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: UserRole.admin,
    });
    this.AddAdminForm.markAsPristine();
    this.AddAdminForm.markAsUntouched();
    this.submitError.set(false);
  }

  protected onSubmit(): void {
    if (this.AddAdminForm.invalid) {
      this.AddAdminForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(false);
    this.submitSuccess.set(false);

    this.adminService.createAdmin(this.AddAdminForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        this.created.emit();
        this.closeDialog();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set(true);
      },
    });
  }
}
