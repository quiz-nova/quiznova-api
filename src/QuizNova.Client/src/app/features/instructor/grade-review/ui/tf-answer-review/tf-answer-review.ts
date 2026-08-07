import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AnswerReviewContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isTf, Tf } from '@shared/models/quiz/questions/tf.model';
import {
  QuestionAnswer,
  TfAnswer,
  isTfAnswer,
} from '@shared/models/quiz-attempt/question-answer.model';

@Component({
  selector: 'qn-tf-answer-review',
  imports: [],
  template: `
    <div class="auto-answer-section">
      <div class="answer-row">
        <span class="answer-label">Student chose:</span>
        <span class="answer-value">{{ tfAnswer().studentChoice ? 'True' : 'False' }}</span>
      </div>
      <div class="answer-row">
        <span class="answer-label">Correct answer:</span>
        <span class="answer-value correct">{{
          tfQuestion().correctChoice ? 'True' : 'False'
        }}</span>
      </div>

      <div
        class="result-badge"
        [class.is-correct]="tfAnswer().isCorrect"
        [class.is-wrong]="!tfAnswer().isCorrect"
      >
        <i [class]="tfAnswer().isCorrect ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
        {{ tfAnswer().isCorrect ? '+' + question().marks + ' pts' : '0 pts' }}
      </div>
    </div>
  `,
  styleUrl: './tf-answer-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfAnswerReview implements AnswerReviewContract {
  readonly question = input.required<Question>();
  readonly answer = input<QuestionAnswer | null>(null);

  protected readonly tfAnswer = computed<TfAnswer>(() => {
    const a = this.answer();
    if (a === null) {
      throw new Error('[TfAnswerReview] Answer input is required but was not provided.');
    }
    if (!isTfAnswer(a)) {
      throw new Error(`[TfAnswerReview] Expected TfAnswer, but received: ${a.answerType}`);
    }
    return a;
  });
  protected readonly tfQuestion = computed<Tf>(() => {
    const q = this.question();
    if (!isTf(q)) {
      throw new Error(`[TfAnswerReview] Expected True/False question, but received: ${q.type}`);
    }
    return q;
  });
}
