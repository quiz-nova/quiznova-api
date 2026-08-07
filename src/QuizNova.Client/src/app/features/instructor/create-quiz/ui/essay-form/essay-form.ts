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

import { Textarea } from 'primeng/textarea';

import { FieldError } from '@shared/components/field-error/field-error';
import { QuestionFormContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { Essay, isEssay } from '@shared/models/quiz/questions/essay.model';
import { CustomValidators } from '@shared/validators/custom-validators';

import { QuestionTitle } from '../question-title/question-title';

type EssayFormGroup = FormGroup<{
  questionText: FormControl<string>;
  answerReference: FormControl<string | null>;
}>;

@Component({
  selector: 'qn-essay-form',
  imports: [ReactiveFormsModule, QuestionTitle, FieldError, Textarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="essay-question-container">
      <form class="essay-question-form" [formGroup]="essayForm">
        <qn-question-title
          [control]="questionTextControl"
          (titleBlur)="onTitleBlur($event)"
        ></qn-question-title>

        <div class="field-container">
          <label class="field-label" for="answerReference"
            >Expected Answer (for grading reference)</label
          >
          <textarea
            class="answer-input"
            id="answerReference"
            [attr.aria-invalid]="
              answerReferenceControl.invalid && answerReferenceControl.touched ? 'true' : null
            "
            [autoResize]="true"
            [formControl]="answerReferenceControl"
            (blur)="onBlur()"
            pTextarea
            placeholder="Enter the expected answer or keywords for grading..."
            rows="4"
            aria-describedby="answer-reference-minlength-error answer-reference-maxlength-error"
          ></textarea>
          <p class="field-help-text">This will be shown to the grader as a reference answer.</p>

          @if (answerReferenceControl.invalid && answerReferenceControl.touched) {
            @if (answerReferenceControl.hasError('minlength')) {
              <qn-field-error id="answer-reference-minlength-error"
                >Reference answer must be at least 3 characters long.</qn-field-error
              >
            }
            @if (answerReferenceControl.hasError('maxlength')) {
              <qn-field-error id="answer-reference-maxlength-error"
                >Reference answer cannot exceed 1000 characters.</qn-field-error
              >
            }
          }
        </div>
      </form>
    </div>
  `,
  styleUrl: './essay-form.css',
})
export class EssayForm implements QuestionFormContract, OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly initialData = input.required<Question>();

  readonly formReady = output<FormGroup>();
  readonly formDestroyed = output<FormGroup>();
  readonly valueChange = output<Question>();
  readonly blurEvent = output<Question>();
  readonly questionTextBlur = output<{ questionId: string; text: string }>();

  protected readonly essay = computed(() => {
    const data = this.initialData();
    if (!isEssay(data)) {
      throw new Error(`[EssayForm] Expected Essay question data, but received: ${data.type}`);
    }
    return data;
  });

  protected readonly essayForm: EssayFormGroup = this.fb.group({
    questionText: [
      '',
      [
        Validators.required,
        CustomValidators.trimMinLength(3),
        CustomValidators.trimMaxLength(1000),
      ],
    ],
    answerReference: [
      null as string | null,
      [CustomValidators.trimMinLength(3), CustomValidators.trimMaxLength(1000)],
    ],
  });

  constructor() {
    effect(() => {
      this.populateForm(this.essay());
    });
  }

  protected get questionTextControl() {
    return this.essayForm.controls.questionText;
  }

  protected get answerReferenceControl() {
    return this.essayForm.controls.answerReference;
  }

  ngOnInit() {
    this.essayForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.valueChange.emit(this.getLatestEssayData());
    });

    this.formReady.emit(this.essayForm);
  }

  ngOnDestroy(): void {
    this.formDestroyed.emit(this.essayForm);
  }

  private populateForm(essay: Essay) {
    this.essayForm.patchValue(
      {
        questionText: essay.questionText,
        answerReference: essay.answerReference,
      },
      { emitEvent: false },
    );
  }

  protected onTitleBlur(text: string) {
    this.questionTextBlur.emit({ questionId: this.initialData().id, text });
    this.onBlur();
  }

  protected onBlur() {
    if (this.essayForm.valid) {
      this.blurEvent.emit(this.getLatestEssayData());
    }
  }

  private getLatestEssayData(): Essay {
    const formValue = this.essayForm.getRawValue();
    const originalEssay = this.essay();

    return {
      ...originalEssay,
      questionText: formValue.questionText,
      answerReference: formValue.answerReference,
    };
  }
}
