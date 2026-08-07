import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StudentAnswerReviewContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isMcq, Mcq } from '@shared/models/quiz/questions/mcq.model';
import {
  isMcqAnswer,
  McqAnswer,
  QuestionAnswer,
} from '@shared/models/quiz-attempt/question-answer.model';

@Component({
  selector: 'qn-mcq-answer-review',
  imports: [],
  template: `
    <article
      class="review-question"
      [class.review-question--correct]="mcqAnswer().isCorrect"
      [class.review-question--incorrect]="!mcqAnswer().isCorrect"
      aria-label="Reviewed multiple choice question"
    >
      <header class="review-question__header">
        <div class="review-question__meta">
          <span class="review-question__index">Q{{ questionNumber() }}</span>
          <span class="review-question__type">Multiple Choice</span>
        </div>

        <span class="review-question__marks">
          {{ mcqAnswer().isCorrect ? '+' + mcq().marks : '0' }}/{{ mcq().marks }} pt
        </span>
      </header>

      <p class="review-question__text">{{ mcq().questionText }}</p>

      <div class="review-question__choices">
        @for (choice of choices(); track choice.id; let i = $index) {
          <div
            class="review-choice"
            [class.review-choice--correct]="choice.id === mcq().correctChoiceId"
            [class.review-choice--selected]="choice.id === mcqAnswer().selectedChoiceId"
            [class.review-choice--selected-wrong]="
              choice.id === mcqAnswer().selectedChoiceId && !mcqAnswer().isCorrect
            "
          >
            <span class="review-choice__prefix">{{ letter(i) }}.</span>
            <span class="review-choice__text">{{ choice.text }}</span>

            @if (choice.id === mcqAnswer().selectedChoiceId) {
              <span class="review-choice__pill">your pick</span>
            } @else if (choice.id === mcq().correctChoiceId) {
              <span class="review-choice__pill review-choice__pill--correct">correct</span>
            }
          </div>
        }
      </div>
    </article>
  `,
  styleUrl: './mcq-answer-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McqAnswerReview implements StudentAnswerReviewContract {
  readonly question = input.required<Question>();
  readonly answer = input.required<QuestionAnswer>();
  readonly questionNumber = input.required<number>();

  protected readonly mcq = computed<Mcq>(() => {
    const q = this.question();
    if (!isMcq(q)) {
      throw new Error(`[StudentMcqAnswerReview] Expected MCQ question, but received: ${q.type}`);
    }
    return q;
  });
  protected readonly mcqAnswer = computed<McqAnswer>(() => {
    const a = this.answer();
    if (!isMcqAnswer(a)) {
      throw new Error(`[StudentMcqAnswerReview] Expected McqAnswer, but received: ${a.answerType}`);
    }
    return a;
  });

  protected readonly choices = computed(() => {
    return [...this.mcq().choices].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  protected letter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
