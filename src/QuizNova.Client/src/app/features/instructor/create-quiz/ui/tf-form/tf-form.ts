import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  OnDestroy,
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

import { RadioButton } from 'primeng/radiobutton';

import { FieldError } from '@shared/components/field-error/field-error';
import { QuestionFormContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isTf, Tf } from '@shared/models/quiz/questions/tf.model';
import { CustomValidators } from '@shared/validators/custom-validators';

import { QuestionTitle } from '../question-title/question-title';

type TfFormGroup = FormGroup<{
  text: FormControl<string>;
  answer: FormControl<boolean | null>;
}>;

@Component({
  selector: 'qn-tf-form',
  imports: [ReactiveFormsModule, QuestionTitle, RadioButton, FieldError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tf-container">
      <form [formGroup]="tfForm">
        <qn-question-title
          [control]="questionTextControl"
          (titleBlur)="onTitleBlur($event)"
        ></qn-question-title>
        <p>Correct Answer:</p>
        <fieldset class="tf-options">
          <legend class="sr-only">Correct Answer</legend>
          <label class="answer-option" for="answerTrue">
            <p-radiobutton
              [formControl]="answerControl"
              [value]="true"
              [attr.aria-invalid]="answerControl.invalid && answerControl.touched ? 'true' : null"
              (onClick)="onBlur()"
              inputId="answerTrue"
              name="answer"
              aria-describedby="please-select-the-correct-answer-error"
            ></p-radiobutton>
            <span>True</span>
          </label>
          <label class="answer-option" for="answerFalse">
            <p-radiobutton
              [formControl]="answerControl"
              [value]="false"
              [attr.aria-invalid]="answerControl.invalid && answerControl.touched ? 'true' : null"
              (onClick)="onBlur()"
              inputId="answerFalse"
              name="answer"
              aria-describedby="please-select-the-correct-answer-error"
            ></p-radiobutton>
            <span>False</span>
          </label>
        </fieldset>

        @if (answerControl.invalid && answerControl.touched) {
          @if (answerControl.hasError('required')) {
            <qn-field-error id="please-select-the-correct-answer-error"
              >Please select the correct answer.</qn-field-error
            >
          }
        }
      </form>
    </div>
  `,
  styleUrl: './tf-form.css',
})
export class TfForm implements QuestionFormContract, OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly initialData = input.required<Question>();

  readonly formReady = output<FormGroup>();
  readonly formDestroyed = output<FormGroup>();
  readonly valueChange = output<Question>();
  readonly blurEvent = output<Question>();
  readonly questionTextBlur = output<{ questionId: string; text: string }>();

  protected readonly tf = computed(() => {
    const data = this.initialData();
    if (!isTf(data)) {
      throw new Error(`[TfForm] Expected True/False question data, but received: ${data.type}`);
    }
    return data;
  });

  protected readonly tfForm: TfFormGroup = this.fb.group({
    text: [
      '',
      [
        Validators.required,
        CustomValidators.trimMinLength(3),
        CustomValidators.trimMaxLength(1000),
      ],
    ],
    answer: [null as boolean | null, [Validators.required]],
  });

  constructor() {
    effect(() => {
      this.populateForm(this.tf());
    });
  }

  protected get questionTextControl() {
    return this.tfForm.controls.text;
  }

  protected get answerControl() {
    return this.tfForm.controls.answer;
  }

  ngOnInit() {
    this.tfForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.valueChange.emit(this.getLatestTfData());
    });

    this.formReady.emit(this.tfForm);
  }

  ngOnDestroy() {
    this.formDestroyed.emit(this.tfForm);
  }

  private populateForm(tf: Tf) {
    this.tfForm.patchValue(
      {
        text: tf.questionText,
        answer: tf.correctChoice,
      },
      { emitEvent: false },
    );
  }

  protected onTitleBlur(text: string) {
    this.questionTextBlur.emit({ questionId: this.initialData().id, text });
    this.onBlur();
  }

  protected onBlur() {
    if (this.tfForm.valid) {
      this.blurEvent.emit(this.getLatestTfData());
    }
  }

  private getLatestTfData(): Tf {
    const formValue = this.tfForm.getRawValue();
    const originalTf = this.tf();

    return {
      ...originalTf,
      questionText: formValue.text,
      correctChoice: formValue.answer ?? true,
    };
  }
}
