import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { distinctUntilChanged, startWith } from 'rxjs';

import { QuestionAttemptContract } from '@shared/models/quiz/question-component.contracts';
import { Question, QuestionType } from '@shared/models/quiz/question.model';

import { SubmitTfAnswer } from '../../models/SubmitQuizAttempt.model';
import { QuizAttemptStore } from '../../quiz-attempt.store';

export type TfAttemptForm = FormGroup<{
  selectedOption: FormControl<boolean | null>;
}>;

@Component({
  selector: 'qn-tf-attempt',
  imports: [],
  template: `
    <article class="question-card" aria-label="True or false question">
      <h2>{{ question().questionText }}</h2>

      <div class="options-grid">
        <button
          class="option"
          [class.selected]="selectedOptionControl.value === true"
          (click)="selectedOptionControl.setValue(true)"
          type="button"
        >
          True
        </button>
        <button
          class="option"
          [class.selected]="selectedOptionControl.value === false"
          (click)="selectedOptionControl.setValue(false)"
          type="button"
        >
          False
        </button>
      </div>
    </article>
  `,
  styleUrl: './tf-attempt.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfAttempt implements QuestionAttemptContract, OnInit {
  protected readonly quizAttemptStore = inject(QuizAttemptStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly question = input.required<Question>();

  private readonly fb = inject(FormBuilder);

  protected get selectedOptionControl() {
    return this.tfAttemptForm.controls.selectedOption;
  }
  protected readonly tfAttemptForm: TfAttemptForm = this.fb.group({
    selectedOption: this.fb.control<boolean | null>(null, {
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.selectedOptionControl.valueChanges
      .pipe(
        startWith(this.selectedOptionControl.value),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((selectedValue) => {
        if (selectedValue === null) {
          return;
        }

        const answer: SubmitTfAnswer = {
          questionId: this.question().id,
          studentChoice: selectedValue,
          type: QuestionType.Tf,
        };

        this.quizAttemptStore.setCurrentAnswerDraft(answer);
      });
  }
}
