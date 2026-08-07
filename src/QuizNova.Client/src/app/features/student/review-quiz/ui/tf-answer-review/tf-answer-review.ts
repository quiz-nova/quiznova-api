import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StudentAnswerReviewContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isTf, Tf } from '@shared/models/quiz/questions/tf.model';
import {
  QuestionAnswer,
  isTfAnswer,
  TfAnswer,
} from '@shared/models/quiz-attempt/question-answer.model';

@Component({
  selector: 'qn-tf-answer-review',
  imports: [],
  template: `
    <article
      class="review-question"
      [class.review-question--correct]="tfAnswer().isCorrect"
      [class.review-question--incorrect]="!tfAnswer().isCorrect"
      aria-label="Reviewed tf question"
    >
      <header class="review-question__header">
        <div class="review-question__meta">
          <span class="review-question__index">Q{{ questionNumber() }}</span>
          <span class="review-question__type">True / False</span>
        </div>

        <span class="review-question__marks">
          {{ tfAnswer().isCorrect ? '+' + tf().marks : '0' }}/{{ tf().marks }} pt
        </span>
      </header>

      <p class="review-question__text">{{ tf().questionText }}</p>

      <div class="review-question__answers">
        <div class="review-answer review-answer--student">
          <p class="review-answer__label">Your answer</p>
          <p class="review-answer__value">{{ studentAnswerLabel() }}</p>
        </div>

        <div class="review-answer review-answer--correct">
          <p class="review-answer__label">Correct answer</p>
          <p class="review-answer__value">{{ correctAnswerLabel() }}</p>
        </div>
      </div>
    </article>
  `,
  styleUrl: './tf-answer-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfAnswerReview implements StudentAnswerReviewContract {
  readonly question = input.required<Question>();
  readonly answer = input.required<QuestionAnswer>();
  readonly questionNumber = input.required<number>();

  protected readonly tf = computed<Tf>(() => {
    const q = this.question();
    if (!isTf(q)) {
      throw new Error(
        `[StudentTfAnswerReview] Expected True/False question, but received: ${q.type}`,
      );
    }
    return q;
  });
  protected readonly tfAnswer = computed<TfAnswer>(() => {
    const a = this.answer();
    if (!isTfAnswer(a)) {
      throw new Error(`[StudentTfAnswerReview] Expected TfAnswer, but received: ${a.answerType}`);
    }
    return a;
  });

  protected readonly studentAnswerLabel = computed(() =>
    this.tfAnswer().studentChoice ? 'True' : 'False',
  );
  protected readonly correctAnswerLabel = computed(() =>
    this.tf().correctChoice ? 'True' : 'False',
  );
}
