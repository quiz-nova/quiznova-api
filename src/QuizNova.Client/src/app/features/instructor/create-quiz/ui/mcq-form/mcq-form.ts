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
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { RadioButton } from 'primeng/radiobutton';

import { FieldError } from '@shared/components/field-error/field-error';
import { QuestionFormContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isMcq, Mcq } from '@shared/models/quiz/questions/mcq.model';
import { CustomValidators } from '@shared/validators/custom-validators';

import { QuestionTitle } from '../question-title/question-title';

type McqFormGroup = FormGroup<{
  questionText: FormControl<string>;
  correctChoiceId: FormControl<string | null>;
  choices: FormArray<FormControl<string>>;
}>;

@Component({
  selector: 'qn-mcq-form',
  imports: [ReactiveFormsModule, QuestionTitle, RadioButton, FieldError, Button, InputText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mcq-container">
      <form class="mcq-form" [formGroup]="mcqForm">
        <qn-question-title
          [control]="questionTextControl"
          (titleBlur)="onTitleBlur($event)"
        ></qn-question-title>
        <fieldset class="radio-group" formArrayName="choices">
          <legend class="sr-only">Multiple Choice Options</legend>
          @for (choiceControl of choicesArray.controls; track choiceControl; let index = $index) {
            <div class="radio-item" animate.enter="element-enter" animate.leave="element-leave">
              <div class="radio-item-input">
                <p-radiobutton
                  [inputId]="'choice-' + getChoiceId(index)"
                  [formControl]="correctChoiceControl"
                  [value]="getChoiceId(index)"
                  [attr.aria-invalid]="
                    correctChoiceControl.invalid && correctChoiceControl.touched ? 'true' : null
                  "
                  (onClick)="onBlur()"
                  name="correctChoiceGroup"
                  aria-label="Mark this choice as the correct answer"
                  aria-describedby="please-select-the-correct-answer-error"
                ></p-radiobutton>
                <input
                  class="choice-input"
                  [id]="'choice-' + getChoiceId(index) + 'text'"
                  [formControl]="choiceControl"
                  [attr.aria-invalid]="
                    choiceControl.invalid && choiceControl.touched ? 'true' : null
                  "
                  [attr.aria-label]="'Text for choice ' + (index + 1)"
                  (blur)="onBlur()"
                  pInputText
                  type="text"
                  placeholder="Enter choice text..."
                  aria-describedby="choice-text-is-required-error choice-text-minlength-error choice-text-maxlength-error"
                />
              </div>

              <p-button
                [disabled]="choicesArray.length <= 2"
                [rounded]="true"
                [text]="true"
                (onClick)="onDeleteChoice(index)"
                ariaLabel="Delete choice"
                icon="pi pi-trash"
                severity="danger"
              />
            </div>

            @if (choiceControl.invalid && choiceControl.touched) {
              @if (choiceControl.hasError('required')) {
                <qn-field-error id="choice-text-is-required-error"
                  >Choice text is required.</qn-field-error
                >
              }
              @if (choiceControl.hasError('minlength')) {
                <qn-field-error id="choice-text-minlength-error"
                  >Choice text must be at least 3 characters.</qn-field-error
                >
              }
              @if (choiceControl.hasError('maxlength')) {
                <qn-field-error id="choice-text-maxlength-error"
                  >Choice text cannot exceed 100 characters.</qn-field-error
                >
              }
            }
          }
        </fieldset>

        @if (correctChoiceControl.invalid && correctChoiceControl.touched) {
          @if (correctChoiceControl.hasError('required')) {
            <qn-field-error id="please-select-the-correct-answer-error"
              >Please select the correct answer.</qn-field-error
            >
          }
        }
      </form>
      <p-button
        [disabled]="choicesArray.length >= 5"
        [outlined]="true"
        (onClick)="onAddChoice()"
        icon="pi pi-plus"
        label="Add Choice"
        severity="secondary"
        type="button"
      />
    </div>
  `,
  styleUrl: './mcq-form.css',
})
export class McqForm implements QuestionFormContract, OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly initialData = input.required<Question>();

  readonly formReady = output<FormGroup>();
  readonly formDestroyed = output<FormGroup>();
  readonly valueChange = output<Question>();
  readonly blurEvent = output<Question>();
  readonly questionTextBlur = output<{ questionId: string; text: string }>();
  readonly deleteChoice = output<{ questionId: string; choiceId: string }>();

  protected readonly mcq = computed(() => {
    const data = this.initialData();
    if (!isMcq(data)) {
      throw new Error(`[McqForm] Expected MCQ question data, but received: ${data.type}`);
    }
    return data;
  });

  protected readonly mcqForm: McqFormGroup = this.fb.group({
    questionText: [
      '',
      [
        Validators.required,
        CustomValidators.trimMinLength(3),
        CustomValidators.trimMaxLength(1000),
      ],
    ],
    correctChoiceId: [null as string | null, [Validators.required]],
    choices: this.fb.array<FormControl<string>>([]),
  });

  constructor() {
    effect(() => {
      this.populateForm(this.mcq());
    });
  }

  protected get questionTextControl() {
    return this.mcqForm.controls.questionText;
  }

  protected get correctChoiceControl() {
    return this.mcqForm.controls.correctChoiceId;
  }

  get choicesArray(): FormArray<FormControl<string>> {
    return this.mcqForm.controls.choices;
  }

  ngOnInit() {
    this.mcqForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.valueChange.emit(this.getLatestMcqData());
    });

    this.formReady.emit(this.mcqForm);
  }

  ngOnDestroy(): void {
    this.formDestroyed.emit(this.mcqForm);
  }

  private populateForm(mcq: Mcq) {
    const currentQuestionText = this.mcqForm.controls.questionText.value;
    const currentCorrectChoiceId = this.mcqForm.controls.correctChoiceId.value;
    const currentChoices = this.choicesArray.controls.map((c) => c.value);
    const incomingChoices = mcq.choices.map((c) => c.text);
    const choicesMatch = currentChoices.every((val, i) => val === incomingChoices[i]);

    if (
      currentQuestionText === mcq.questionText &&
      currentCorrectChoiceId === mcq.correctChoiceId &&
      currentChoices.length === incomingChoices.length &&
      choicesMatch
    ) {
      return;
    }

    this.questionTextControl.setValue(mcq.questionText, { emitEvent: false });
    this.correctChoiceControl.setValue(mcq.correctChoiceId, { emitEvent: false });

    this.choicesArray.clear({ emitEvent: false });
    mcq.choices.forEach((choice) => {
      const control = this.fb.control(choice.text, [
        Validators.required,
        CustomValidators.trimMinLength(3),
        CustomValidators.trimMaxLength(100),
      ]);
      this.choicesArray.push(control, { emitEvent: false });
    });
  }

  protected getChoiceId(index: number): string {
    const choices = this.mcq().choices;
    return choices[index]?.id ?? `choice-${index + 1}`;
  }

  protected onTitleBlur(text: string) {
    this.questionTextBlur.emit({ questionId: this.initialData().id, text });
    this.onBlur();
  }

  protected onBlur() {
    if (this.mcqForm.valid) {
      this.blurEvent.emit(this.getLatestMcqData());
    }
  }

  protected onAddChoice() {
    if (this.choicesArray.length >= 5) return;

    const control = this.fb.control('', [
      Validators.required,
      CustomValidators.trimMinLength(3),
      CustomValidators.trimMaxLength(100),
    ]);
    this.choicesArray.push(control);
    this.valueChange.emit(this.getLatestMcqData());
  }

  protected onDeleteChoice(index: number) {
    if (this.choicesArray.length <= 2) return;

    const deletedChoiceId = this.getChoiceId(index);
    this.choicesArray.removeAt(index);

    if (this.correctChoiceControl.value === deletedChoiceId) {
      this.correctChoiceControl.setValue(null);
    }

    this.deleteChoice.emit({ questionId: this.initialData().id, choiceId: deletedChoiceId });
    this.valueChange.emit(this.getLatestMcqData());
  }

  private getLatestMcqData(): Mcq {
    const formValue = this.mcqForm.getRawValue();
    const originalMcq = this.mcq();

    const updatedChoices = formValue.choices.map((text, i) => {
      const existingChoice = originalMcq.choices[i];
      return {
        id: existingChoice?.id ?? `choice-${i + 1}`,
        questionId: originalMcq.id,
        text,
        displayOrder: i + 1,
      };
    });

    return {
      ...originalMcq,
      questionText: formValue.questionText,
      correctChoiceId: formValue.correctChoiceId ?? '',
      choices: updatedChoices,
      numberOfChoices: updatedChoices.length,
    };
  }
}
