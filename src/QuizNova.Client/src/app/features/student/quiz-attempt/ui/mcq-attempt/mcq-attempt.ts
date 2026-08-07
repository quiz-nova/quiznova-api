import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { isMcq, Mcq } from '@shared/models/quiz/questions/mcq.model';

import { SubmitMcqAnswer } from '../../models/SubmitQuizAttempt.model';
import { QuizAttemptStore } from '../../quiz-attempt.store';

export type McqAttemptForm = FormGroup<{
  selectedChoiceId: FormControl<string | null>;
}>;

@Component({
  selector: 'qn-mcq-attempt',
  imports: [],
  template: `
    <article class="question-card" aria-label="Multiple choice question">
      <h2>{{ question().questionText }}</h2>

      <div class="choices-grid">
        @for (choice of mcq().choices; track choice.id) {
          <button
            class="option"
            [class.selected]="selectedChoiceIdControl.value === choice.id"
            (click)="selectedChoiceIdControl.setValue(choice.id)"
            type="button"
          >
            {{ choice.text }}
          </button>
        }
      </div>
    </article>
  `,
  styleUrl: './mcq-attempt.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McqAttempt implements QuestionAttemptContract, OnInit {
  protected readonly quizAttemptStore = inject(QuizAttemptStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly question = input.required<Question>();
  protected readonly mcq = computed<Mcq>(() => {
    const q = this.question();
    if (!isMcq(q)) {
      throw new Error(`[McqAttempt] Expected MCQ question, but received: ${q.type}`);
    }
    return q;
  });
  private readonly fb = inject(FormBuilder);

  protected get selectedChoiceIdControl() {
    return this.mcqAttemptForm.controls.selectedChoiceId;
  }

  protected readonly mcqAttemptForm: McqAttemptForm = this.fb.group({
    selectedChoiceId: this.fb.control<string | null>(null, {
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.selectedChoiceIdControl.valueChanges
      .pipe(
        startWith(this.selectedChoiceIdControl.value),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((choiceId) => {
        if (!choiceId) return;

        const answer: SubmitMcqAnswer = {
          questionId: this.question().id,
          selectedChoiceId: choiceId,
          type: QuestionType.Mcq,
        };

        this.quizAttemptStore.setCurrentAnswerDraft(answer);
      });
  }
}
