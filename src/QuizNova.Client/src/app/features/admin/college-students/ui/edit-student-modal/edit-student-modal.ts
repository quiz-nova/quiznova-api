import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
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

import { FieldError } from '@shared/components/field-error/field-error';
import { Student } from '@shared/models/users/student.model';
import { StudentService } from '@shared/services/student.service';
import { CustomValidators } from '@shared/validators/custom-validators';

type EditStudentFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
}>;

@Component({
  selector: 'qn-edit-student-modal',
  imports: [ReactiveFormsModule, Dialog, FloatLabel, InputText, FieldError, Button],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      (onClick)="openDialog()"
      ariaLabel="Edit student"
      icon="pi pi-pencil"
      severity="secondary"
    />

    <p-dialog
      [visible]="isDialogOpen()"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(40rem, 95vw)' }"
      (visibleChange)="onDialogVisibilityChange($event)"
      header="Edit Student"
    >
      <form class="edit-form" [formGroup]="EditStudentForm" (ngSubmit)="onSubmit()">
        <div class="form-field">
          <p-floatlabel variant="on">
            <input
              id="edit-student-name"
              [fluid]="true"
              [formControl]="nameControl"
              [attr.aria-invalid]="nameControl.invalid && nameControl.touched ? 'true' : null"
              pInputText
              type="text"
              aria-describedby="name-is-required-error name-minlength-error"
            />
            <label for="edit-student-name">Name</label>
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
              id="edit-student-email"
              [fluid]="true"
              [formControl]="emailControl"
              [attr.aria-invalid]="emailControl.invalid && emailControl.touched ? 'true' : null"
              pInputText
              type="email"
              aria-describedby="email-is-required-error please-enter-a-valid-email-address-error"
            />
            <label for="edit-student-email">Email</label>
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
            <input
              id="edit-student-phone"
              [fluid]="true"
              [formControl]="phoneNumberControl"
              [attr.aria-invalid]="
                phoneNumberControl.invalid && phoneNumberControl.touched ? 'true' : null
              "
              pInputText
              type="text"
              aria-describedby="phone-number-is-required-error phone-minlength-error phone-maxlength-error"
            />
            <label for="edit-student-phone">Phone Number</label>
          </p-floatlabel>
          @if (phoneNumberControl.invalid && phoneNumberControl.touched) {
            @if (phoneNumberControl.hasError('required')) {
              <qn-field-error id="phone-number-is-required-error"
                >Phone number is required.</qn-field-error
              >
            }
            @if (phoneNumberControl.hasError('minlength')) {
              <qn-field-error id="phone-minlength-error"
                >Phone number must be at least 7 characters.</qn-field-error
              >
            }
            @if (phoneNumberControl.hasError('maxlength')) {
              <qn-field-error id="phone-maxlength-error"
                >Phone number cannot exceed 15 characters.</qn-field-error
              >
            }
          }
        </div>

        @if (submitError()) {
          <p class="submit-error">Failed to update student. Please check your input.</p>
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
            label="Save Changes"
            severity="success"
            type="submit"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styleUrl: './edit-student-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditStudentModal {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly studentService = inject(StudentService);

  readonly student = input.required<Student>();
  readonly updated = output<void>();

  protected readonly isDialogOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal(false);

  protected readonly EditStudentForm: EditStudentFormGroup = this.fb.group({
    name: ['', [Validators.required, CustomValidators.trimMinLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [
      '',
      [Validators.required, CustomValidators.trimMinLength(7), CustomValidators.trimMaxLength(15)],
    ],
  });

  protected get nameControl() {
    return this.EditStudentForm.controls.name;
  }

  protected get emailControl() {
    return this.EditStudentForm.controls.email;
  }

  protected get phoneNumberControl() {
    return this.EditStudentForm.controls.phoneNumber;
  }

  protected openDialog(): void {
    this.EditStudentForm.reset({
      name: this.student().personalInformation.name,
      email: this.student().personalInformation.email,
      phoneNumber: this.student().personalInformation.phoneNumber,
    });
    this.EditStudentForm.markAsPristine();
    this.EditStudentForm.markAsUntouched();
    this.submitError.set(false);
    this.isDialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  protected onDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.closeDialog();
      return;
    }

    this.isDialogOpen.set(true);
  }

  protected onSubmit(): void {
    if (this.EditStudentForm.invalid) {
      this.EditStudentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(false);

    this.studentService
      .updateStudent(this.student().id, this.EditStudentForm.getRawValue())
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.updated.emit();
          this.closeDialog();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.submitError.set(true);
        },
      });
  }
}
