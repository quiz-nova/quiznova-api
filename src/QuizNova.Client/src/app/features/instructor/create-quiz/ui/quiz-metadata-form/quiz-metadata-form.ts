import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AuthService } from '@Features/auth/auth.service';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { of, switchMap } from 'rxjs';

import { FieldError } from '@shared/components/field-error/field-error';
import { CoursesService } from '@shared/services/courses.service';
import { CustomValidators } from '@shared/validators/custom-validators';

import { timeValidator } from '../../../validators/time-validator';

export interface QuizMetadataValue {
  title: string;
  courseId: string;
  startsAtUtc: Date;
  endsAtUtc: Date;
}

export type QuizHeaderFormGroup = FormGroup<{
  title: FormControl<string>;
  courseId: FormControl<string>;
  startsAtUtc: FormControl<Date>;
  endsAtUtc: FormControl<Date>;
}>;

@Component({
  selector: 'qn-quiz-metadata-form',
  imports: [ReactiveFormsModule, Select, DatePicker, InputText, FieldError],
  template: `
    <form class="metadata-form" [formGroup]="quizHeaderForm">
      <div class="field-group">
        <label class="dropdown-label" for="quiz-title">Quiz Title</label>
        <input
          class="focus-green-ring"
          id="quiz-title"
          [formControl]="titleControl"
          [attr.aria-invalid]="titleControl.invalid && titleControl.touched ? 'true' : null"
          (blur)="emitValue()"
          pInputText
          type="text"
          placeholder="e.g. Week 8 Assessment"
          aria-describedby="quiz-title-is-required-error quiz-title-minlength-error quiz-title-maxlength-error"
        />

        @if (titleControl.invalid && (titleControl.touched || titleControl.dirty)) {
          @if (titleControl.hasError('required')) {
            <qn-field-error id="quiz-title-is-required-error"
              >Quiz title is required.</qn-field-error
            >
          }
          @if (titleControl.hasError('minlength')) {
            <qn-field-error id="quiz-title-minlength-error"
              >Quiz title must be at least 3 characters.</qn-field-error
            >
          }
          @if (titleControl.hasError('maxlength')) {
            <qn-field-error id="quiz-title-maxlength-error"
              >Quiz title cannot exceed 30 characters.</qn-field-error
            >
          }
        }
      </div>

      <div class="field-group">
        <label class="dropdown-label" for="quiz-course">Course</label>
        <p-select
          class="focus-green-ring dropdown-field"
          [formControl]="courseIdControl"
          [options]="instructorCourses() ?? []"
          [attr.aria-invalid]="courseIdControl.invalid && courseIdControl.touched ? 'true' : null"
          (onChange)="onCourseChange($event.value)"
          inputId="quiz-course"
          optionLabel="courseName"
          optionValue="id"
          placeholder="Select course"
          appendTo="body"
          aria-describedby="course-is-required-error"
        />

        @if (courseIdControl.invalid && (courseIdControl.touched || courseIdControl.dirty)) {
          @if (courseIdControl.hasError('required')) {
            <qn-field-error id="course-is-required-error">Course is required.</qn-field-error>
          }
        }
      </div>

      <div class="field-group">
        <label class="dropdown-label" for="quiz-starts-at">Starts At</label>
        <p-datepicker
          class="focus-green-ring dropdown-field"
          id="quiz-starts-at"
          [formControl]="startsAtControl"
          [showTime]="true"
          [showIcon]="true"
          [fluid]="true"
          [attr.aria-invalid]="startsAtControl.invalid ? 'true' : null"
          (onBlur)="emitValue()"
          inputId="quiz-starts-at"
          hourFormat="12"
          iconDisplay="input"
          appendTo="body"
          aria-describedby="starts-at-is-required-error"
        />

        @if (startsAtControl.invalid) {
          @if (startsAtControl.hasError('required')) {
            <qn-field-error id="starts-at-is-required-error"
              >Start time is required.</qn-field-error
            >
          }
        }
      </div>

      <div class="field-group">
        <label class="dropdown-label" for="quiz-ends-at">Ends At</label>
        <p-datepicker
          class="focus-green-ring dropdown-field"
          id="quiz-ends-at"
          [formControl]="endsAtControl"
          [showTime]="true"
          [showIcon]="true"
          [fluid]="true"
          [attr.aria-invalid]="
            endsAtControl.invalid || quizHeaderForm.hasError('invalidTimeRange') ? 'true' : null
          "
          (onBlur)="emitValue()"
          inputId="quiz-ends-at"
          hourFormat="12"
          iconDisplay="input"
          appendTo="body"
          aria-describedby="ends-at-is-required-error end-time-must-be-after-start-time-error"
        />

        @if (endsAtControl.invalid) {
          @if (endsAtControl.hasError('required')) {
            <qn-field-error id="ends-at-is-required-error">End time is required.</qn-field-error>
          }
        }

        @if (
          quizHeaderForm.hasError('invalidTimeRange') &&
          (startsAtControl.touched || endsAtControl.touched)
        ) {
          <qn-field-error id="end-time-must-be-after-start-time-error">
            End time must be after start time.
          </qn-field-error>
        }
      </div>
    </form>
  `,
  styleUrl: './quiz-metadata-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizMetadataForm implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly authService = inject(AuthService);
  private readonly coursesService = inject(CoursesService);

  readonly formReady = output<QuizHeaderFormGroup>();
  readonly formDestroyed = output<QuizHeaderFormGroup>();
  readonly valueChange = output<QuizMetadataValue>();
  readonly courseIdChanged = output<string>();

  private readonly instructorId = computed(() => this.authService.currentUser()?.id ?? '');

  protected readonly instructorCourses = toSignal(
    toObservable(this.instructorId).pipe(
      switchMap((id) => (id ? this.coursesService.getInstructorCourses(id) : of([]))),
    ),
  );

  protected readonly quizHeaderForm: QuizHeaderFormGroup = this.fb.group(
    {
      title: [
        '',
        [
          Validators.required,
          CustomValidators.trimMinLength(3),
          CustomValidators.trimMaxLength(30),
        ],
      ],
      courseId: ['', [Validators.required]],
      startsAtUtc: [new Date(), [Validators.required]],
      endsAtUtc: [new Date(Date.now() + 60 * 60 * 1000), [Validators.required]],
    },
    { validators: timeValidator },
  );

  ngOnInit() {
    this.formReady.emit(this.quizHeaderForm);

    this.quizHeaderForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.emitValue();
    });
  }

  ngOnDestroy() {
    this.formDestroyed.emit(this.quizHeaderForm);
  }

  protected get titleControl() {
    return this.quizHeaderForm.controls.title;
  }

  protected get courseIdControl() {
    return this.quizHeaderForm.controls.courseId;
  }

  protected get startsAtControl() {
    return this.quizHeaderForm.controls.startsAtUtc;
  }

  protected get endsAtControl() {
    return this.quizHeaderForm.controls.endsAtUtc;
  }

  protected onCourseChange(newCourseId: string) {
    this.courseIdControl.setValue(newCourseId);
    this.courseIdChanged.emit(newCourseId);
    this.emitValue();
  }

  protected emitValue() {
    if (this.quizHeaderForm.valid) {
      this.valueChange.emit(this.quizHeaderForm.getRawValue());
    }
  }
}
