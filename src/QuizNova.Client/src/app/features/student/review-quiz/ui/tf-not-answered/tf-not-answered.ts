import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { QuestionNotAnsweredContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isTf, Tf } from '@shared/models/quiz/questions/tf.model';

@Component({
  selector: 'qn-tf-question-not-answered',
  imports: [],
  template: `
    <article class="review-question" aria-label="Unanswered tf question">
      <header class="review-question__header">
        <div class="review-question__meta">
          <span class="review-question__index">Q{{ questionNumber() }}</span>
          <span class="review-question__type">True / False</span>
        </div>

        <span class="review-question__marks">0/{{ question().marks }} pt</span>
      </header>

      <p class="review-question__text">{{ question().questionText }}</p>
      <p class="review-question__note">Not answered</p>

      <div class="review-question__answers">
        <div class="review-answer review-answer--student">
          <p class="review-answer__label">Your answer</p>
          <p class="review-answer__value">Not answered</p>
        </div>

        <div class="review-answer review-answer--correct">
          <p class="review-answer__label">Correct answer</p>
          <p class="review-answer__value">{{ correctAnswerLabel() }}</p>
        </div>
      </div>
    </article>
  `,
  styleUrl: './tf-not-answered.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfNotAnswered implements QuestionNotAnsweredContract {
  readonly question = input.required<Question>();
  readonly tf = computed<Tf>(() => {
    const q = this.question();
    if (!isTf(q)) {
      throw new Error(`[TfNotAnswered] Expected True/False question, but received: ${q.type}`);
    }
    return q;
  });
  readonly questionNumber = input.required<number>();

  protected readonly correctAnswerLabel = computed(() =>
    this.tf().correctChoice ? 'True' : 'False',
  );
}
