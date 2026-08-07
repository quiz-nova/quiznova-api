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
import { Instructor } from '@shared/models/users/instructor.model';
import { InstructorService } from '@shared/services/instructor.service';
import { CustomValidators } from '@shared/validators/custom-validators';

type EditInstructorFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
}>;

@Component({
  selector: 'qn-edit-instructor-modal',
  imports: [ReactiveFormsModule, Dialog, FloatLabel, InputText, FieldError, Button],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      (onClick)="openDialog()"
      ariaLabel="Edit instructor"
      icon="pi pi-pencil"
      severity="secondary"
    />

    <p-dialog
      [visible]="isDialogOpen()"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(40rem, 95vw)' }"
      (visibleChange)="onDialogVisibilityChange($event)"
      header="Edit Instructor"
    >
      <form class="edit-form" [formGroup]="EditInstructorForm" (ngSubmit)="onSubmit()">
        <div class="form-field">
          <p-floatlabel variant="on">
            <input
              id="edit-instructor-name"
              [fluid]="true"
              [formControl]="nameControl"
              pInputText
              type="text"
            />
            <label for="edit-instructor-name">Name</label>
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
              id="edit-instructor-email"
              [fluid]="true"
              [formControl]="emailControl"
              [attr.aria-invalid]="emailControl.invalid && emailControl.touched ? 'true' : null"
              pInputText
              type="email"
              aria-describedby="email-is-required-error please-enter-a-valid-email-address-error"
            />
            <label for="edit-instructor-email">Email</label>
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
              id="edit-instructor-phone"
              [fluid]="true"
              [formControl]="phoneNumberControl"
              [attr.aria-invalid]="
                phoneNumberControl.invalid && phoneNumberControl.touched ? 'true' : null
              "
              pInputText
              type="text"
              aria-describedby="phone-number-is-required-error phone-minlength-error phone-maxlength-error"
            />
            <label for="edit-instructor-phone">Phone Number</label>
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
          <p class="submit-error">Failed to update instructor. Please check your input.</p>
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
  styleUrl: './edit-instructor-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditInstructorModal {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly instructorService = inject(InstructorService);

  readonly instructor = input.required<Instructor>();
  readonly updated = output<void>();

  protected readonly isDialogOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal(false);

  protected readonly EditInstructorForm: EditInstructorFormGroup = this.fb.group({
    name: ['', [Validators.required, CustomValidators.trimMinLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [
      '',
      [Validators.required, CustomValidators.trimMinLength(7), CustomValidators.trimMaxLength(15)],
    ],
  });

  protected get nameControl() {
    return this.EditInstructorForm.controls.name;
  }

  protected get emailControl() {
    return this.EditInstructorForm.controls.email;
  }

  protected get phoneNumberControl() {
    return this.EditInstructorForm.controls.phoneNumber;
  }

  protected openDialog(): void {
    this.EditInstructorForm.reset({
      name: this.instructor().personalInformation.name,
      email: this.instructor().personalInformation.email,
      phoneNumber: this.instructor().personalInformation.phoneNumber,
    });
    this.EditInstructorForm.markAsPristine();
    this.EditInstructorForm.markAsUntouched();
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
    if (this.EditInstructorForm.invalid) {
      this.EditInstructorForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(false);

    this.instructorService
      .updateInstructor(this.instructor().id, this.EditInstructorForm.getRawValue())
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
