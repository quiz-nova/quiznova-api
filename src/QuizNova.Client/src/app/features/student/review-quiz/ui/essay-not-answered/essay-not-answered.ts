import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { QuestionNotAnsweredContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { Essay, isEssay } from '@shared/models/quiz/questions/essay.model';

@Component({
  selector: 'qn-essay-question-not-answered',
  imports: [],
  template: `
    <article class="review-question" aria-label="Unanswered essay question">
      <header class="review-question__header">
        <div class="review-question__meta">
          <span class="review-question__index">Q{{ questionNumber() }}</span>
          <span class="review-question__type">Essay</span>
        </div>

        <span class="review-question__marks">0/{{ question().marks }} pt</span>
      </header>

      <p class="review-question__text">{{ question().questionText }}</p>
      <p class="review-question__note">Not answered</p>

      <div class="review-question__answers" [class.single-column]="!essay().answerReference">
        <div class="review-answer review-answer--student">
          <p class="review-answer__label">Your answer</p>
          <p class="review-answer__value">Not answered</p>
        </div>

        @if (essay().answerReference) {
          <div class="review-answer review-answer--correct">
            <p class="review-answer__label">Reference answer</p>
            <p class="review-answer__value">{{ essay().answerReference }}</p>
          </div>
        }
      </div>
    </article>
  `,
  styleUrl: './essay-not-answered.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayNotAnswered implements QuestionNotAnsweredContract {
  readonly question = input.required<Question>();
  readonly questionNumber = input.required<number>();

  protected readonly essay = computed<Essay>(() => {
    const q = this.question();
    if (!isEssay(q)) {
      throw new Error(`[EssayNotAnswered] Expected Essay question, but received: ${q.type}`);
    }
    return q;
  });
}
