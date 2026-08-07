import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { Button } from 'primeng/button';
import { Select } from 'primeng/select';

import { Question, QuestionType } from '@shared/models/quiz/question.model';

import { CreateQuizStore } from '../../stores/create-quiz.store';
import { mapQuestionTypeToQuestion } from '../../utils/question-type.mapper';

type AddQuestionFormGroup = FormGroup<{
  questionType: FormControl<QuestionType>;
}>;

@Component({
  selector: 'qn-add-question',
  imports: [ReactiveFormsModule, Select, Button],
  template: `
    <div class="add-question">
      <div class="question-type-group">
        <label class="dropdown-label" for="questionType">Question Type</label>
        <p-select
          class="dropdown-field dropdown-field--wide"
          [formControl]="questionTypeControl"
          [options]="questionTypeOptions"
          inputId="questionType"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
        />
      </div>
      <p-button
        [disabled]="!store.canAddMoreQuestions()"
        (onClick)="onAddQuestion()"
        icon="pi pi-plus"
        label="Add Question"
        severity="success"
        type="button"
      />
    </div>
  `,
  styleUrl: './add-question.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQuestion {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly store = inject(CreateQuizStore);

  readonly questionAdded = output<Question>();

  protected readonly questionTypeOptions: { label: string; value: QuestionType }[] = [
    { label: 'Multiple Choice', value: QuestionType.Mcq },
    { label: 'True / False', value: QuestionType.Tf },
    { label: 'Essay', value: QuestionType.Essay },
  ];

  protected readonly addQuestionForm: AddQuestionFormGroup = this.fb.group({
    questionType: this.fb.control<QuestionType>(QuestionType.Mcq),
  });

  protected get questionTypeControl() {
    return this.addQuestionForm.controls.questionType;
  }

  protected onAddQuestion(): void {
    const selectedType = this.questionTypeControl.value;
    const remainingMarks = this.store.effectiveRemainingMarks() ?? 0;
    const displayOrder = this.store.questions().length + 1;

    const newQuestion = mapQuestionTypeToQuestion(selectedType, {
      remainingMarks,
      displayOrder,
    });

    if (newQuestion) {
      this.questionAdded.emit(newQuestion);
    }
  }
}
