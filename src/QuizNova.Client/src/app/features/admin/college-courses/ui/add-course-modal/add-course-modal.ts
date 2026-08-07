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
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import { FieldError } from '@shared/components/field-error/field-error';
import { Instructor } from '@shared/models/users/instructor.model';
import { CoursesService } from '@shared/services/courses.service';
import { InstructorService } from '@shared/services/instructor.service';
import { CustomValidators } from '@shared/validators/custom-validators';

type AddCourseFormGroup = FormGroup<{
  name: FormControl<string>;
  instructorId: FormControl<string | null>;
  minimumPassingMarks: FormControl<number>;
  maximumMarks: FormControl<number>;
}>;

@Component({
  selector: 'qn-add-course-modal',
  imports: [
    Dialog,
    FieldError,
    FloatLabel,
    InputNumber,
    InputText,
    ReactiveFormsModule,
    Select,
    Button,
  ],
  template: `
    <p-button (onClick)="openDialog()" label="Add Course" severity="success" type="button" />

    <p-dialog
      [visible]="isDialogOpen()"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(40rem, 95vw)' }"
      (visibleChange)="onDialogVisibilityChange($event)"
      header="Add Course"
    >
      <form class="add-form" [formGroup]="addCourseForm" (ngSubmit)="onSubmit()">
        <div class="form-field">
          <p-floatlabel variant="on">
            <input
              id="course-name"
              [fluid]="true"
              [formControl]="nameControl"
              [attr.aria-invalid]="nameControl.invalid && nameControl.touched ? 'true' : null"
              pInputText
              type="text"
              aria-describedby="course-name-is-required-error course-name-minlength-error course-name-maxlength-error"
            />
            <label for="course-name">Course Name</label>
          </p-floatlabel>
          @if (nameControl.invalid && nameControl.touched) {
            @if (nameControl.hasError('required')) {
              <qn-field-error id="course-name-is-required-error"
                >Course name is required.</qn-field-error
              >
            }
            @if (nameControl.hasError('minlength')) {
              <qn-field-error id="course-name-minlength-error"
                >Course name must be at least 3 characters.</qn-field-error
              >
            }
            @if (nameControl.hasError('maxlength')) {
              <qn-field-error id="course-name-maxlength-error"
                >Course name cannot exceed 30 characters.</qn-field-error
              >
            }
          }
        </div>

        <div class="form-field">
          <label class="field-label" for="course-instructor">Instructor</label>
          <p-select
            [options]="instructorOptions()"
            [filter]="true"
            [showClear]="true"
            [formControl]="instructorIdControl"
            (onShow)="loadInstructors()"
            inputId="course-instructor"
            optionLabel="name"
            optionValue="id"
            filterBy="name"
            placeholder="No instructor"
            appendTo="body"
          ></p-select>
        </div>

        <div class="form-field">
          <p-floatlabel variant="on">
            <p-inputnumber
              [min]="1"
              [formControl]="minimumPassingMarksControl"
              [attr.aria-invalid]="
                minimumPassingMarksControl.invalid && minimumPassingMarksControl.touched
                  ? 'true'
                  : null
              "
              inputId="minimum-passing-marks"
              aria-describedby="minimum-passing-marks-must-be-greater-than-zero-error"
            />
            <label for="minimum-passing-marks">Minimum Passing Marks</label>
          </p-floatlabel>
          @if (minimumPassingMarksControl.invalid && minimumPassingMarksControl.touched) {
            <qn-field-error id="minimum-passing-marks-must-be-greater-than-zero-error"
              >Minimum passing marks must be greater than zero.</qn-field-error
            >
          }
        </div>

        <div class="form-field">
          <p-floatlabel variant="on">
            <p-inputnumber
              [min]="1"
              [formControl]="maximumMarksControl"
              [attr.aria-invalid]="
                maximumMarksControl.invalid && maximumMarksControl.touched ? 'true' : null
              "
              inputId="maximum-marks"
              aria-describedby="maximum-marks-must-be-greater-than-zero-error"
            />
            <label for="maximum-marks">Maximum Marks</label>
          </p-floatlabel>
          @if (maximumMarksControl.invalid && maximumMarksControl.touched) {
            <qn-field-error id="maximum-marks-must-be-greater-than-zero-error"
              >Maximum marks must be greater than zero.</qn-field-error
            >
          }
        </div>

        @if (submitError()) {
          <p class="submit-error">Failed to create course. Please check your input.</p>
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
            label="Save Course"
            severity="success"
            type="submit"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styleUrl: './add-course-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCourseModal {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly coursesService = inject(CoursesService);
  private readonly instructorService = inject(InstructorService);

  readonly created = output<void>();

  protected readonly isDialogOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal(false);
  protected readonly instructors = signal<Instructor[]>([]);

  protected readonly addCourseForm: AddCourseFormGroup = this.fb.group({
    name: [
      '',
      [Validators.required, CustomValidators.trimMinLength(3), CustomValidators.trimMaxLength(30)],
    ],
    instructorId: this.fb.control<string | null>(null),
    minimumPassingMarks: [1, [Validators.required, Validators.min(1)]],
    maximumMarks: [1, [Validators.required, Validators.min(1)]],
  });

  protected readonly instructorOptions = () =>
    this.instructors().map((instructor) => ({
      id: instructor.id,
      name: instructor.personalInformation.name,
    }));

  protected get nameControl() {
    return this.addCourseForm.controls.name;
  }

  protected get instructorIdControl() {
    return this.addCourseForm.controls.instructorId;
  }

  protected get minimumPassingMarksControl() {
    return this.addCourseForm.controls.minimumPassingMarks;
  }

  protected get maximumMarksControl() {
    return this.addCourseForm.controls.maximumMarks;
  }

  protected openDialog(): void {
    this.submitError.set(false);
    this.isDialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.isDialogOpen.set(false);
    this.resetForm();
  }

  protected onDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.closeDialog();
      return;
    }

    this.isDialogOpen.set(true);
  }

  protected loadInstructors(): void {
    if (this.instructors().length) {
      return;
    }

    this.instructorService.getAllInstructors({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (response) => this.instructors.set(response.items),
    });
  }

  protected resetForm(): void {
    this.addCourseForm.reset({
      name: '',
      instructorId: null,
      minimumPassingMarks: 1,
      maximumMarks: 1,
    });
    this.addCourseForm.markAsPristine();
    this.addCourseForm.markAsUntouched();
    this.submitError.set(false);
  }

  protected onSubmit(): void {
    if (this.addCourseForm.invalid) {
      this.addCourseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(false);

    this.coursesService.createCourse(this.addCourseForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
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
