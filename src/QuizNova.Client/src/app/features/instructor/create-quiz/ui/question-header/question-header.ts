import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Button } from 'primeng/button';

import { FieldError } from '@shared/components/field-error/field-error';
import { Question } from '@shared/models/quiz/question.model';

type QuestionHeaderFormGroup = FormGroup<{
  marks: FormControl<number>;
}>;

@Component({
  selector: 'qn-question-header',
  imports: [ReactiveFormsModule, Button, FieldError],
  template: `
    <header class="question-header">
      <div class="question-header__details">
        <h3>Q{{ index() + 1 }}</h3>
        <ng-content></ng-content>
      </div>

      <div class="question-header__actions">
        <form [formGroup]="form">
          <label for="marks">Marks</label>
          <div class="question-header__marks-field">
            <input
              class="question-header__marks focus-green-ring"
              id="marks"
              [formControl]="marksControl"
              [max]="maxMarks()"
              [attr.aria-invalid]="marksControl.invalid && marksControl.touched ? 'true' : null"
              (blur)="onBlur()"
              type="number"
              min="1"
              step="1"
              aria-describedby="marks-is-required-error marks-must-be-between-1-and-max-error"
            />
          </div>
        </form>
        <p-button
          [rounded]="true"
          [text]="true"
          (onClick)="deleteQuestion.emit(question().id)"
          ariaLabel="Delete question"
          icon="pi pi-trash"
          severity="danger"
        />
        @if (marksControl.invalid && marksControl.touched) {
          @if (marksControl.hasError('required')) {
            <qn-field-error id="marks-is-required-error">Marks field is required.</qn-field-error>
          }
          @if (marksControl.hasError('min') || marksControl.hasError('max')) {
            <qn-field-error id="marks-must-be-between-1-and-max-error">
              Marks must be between 1 and {{ maxMarks() }}.
            </qn-field-error>
          }
        }
      </div>
    </header>
  `,
  styleUrl: './question-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionHeader implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly question = input.required<Question>();
  readonly maxMarks = input.required<number>();
  readonly index = input.required<number>();

  readonly deleteQuestion = output<string>();
  readonly marksChange = output<{ questionId: string; marks: number }>();

  protected readonly form: QuestionHeaderFormGroup = this.fb.group({
    marks: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const currentQuestion = this.question();
      const currentMaxMarks = this.maxMarks();

      this.marksControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(currentMaxMarks),
      ]);
      this.marksControl.updateValueAndValidity({ emitEvent: false });

      if (this.marksControl.value !== currentQuestion.marks) {
        this.marksControl.setValue(currentQuestion.marks, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    this.marksControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.form.valid) {
        this.marksChange.emit({
          questionId: this.question().id,
          marks: this.marksControl.value,
        });
      }
    });
  }

  protected get marksControl() {
    return this.form.controls.marks;
  }

  protected onBlur() {
    if (this.form.valid) {
      this.marksChange.emit({
        questionId: this.question().id,
        marks: this.marksControl.value,
      });
    }
  }
}
