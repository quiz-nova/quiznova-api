import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { QuestionNotAnsweredContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { isMcq, Mcq } from '@shared/models/quiz/questions/mcq.model';

@Component({
  selector: 'qn-mcq-not-answered',
  imports: [],
  template: `
    <article class="review-question" aria-label="Unanswered multiple choice question">
      <header class="review-question__header">
        <div class="review-question__meta">
          <span class="review-question__index">Q{{ questionNumber() }}</span>
          <span class="review-question__type">Multiple Choice</span>
        </div>
        <span class="review-question__marks">0/{{ question().marks }} pt</span>
      </header>

      <p class="review-question__text">{{ question().questionText }}</p>
      <p class="review-question__note">Not answered</p>

      <div class="review-question__choices">
        @for (choice of choices(); track choice.id; let i = $index) {
          <div
            class="review-choice"
            [class.review-choice--correct]="choice.id === mcq().correctChoiceId"
          >
            <span class="review-choice__prefix">{{ letter(i) }}.</span>
            <span class="review-choice__text">{{ choice.text }}</span>
            @if (choice.id === mcq().correctChoiceId) {
              <span class="review-choice__pill">correct</span>
            }
          </div>
        }
      </div>
    </article>
  `,
  styleUrl: './mcq-not-answered.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McqNotAnswered implements QuestionNotAnsweredContract {
  readonly question = input.required<Question>();
  readonly mcq = computed<Mcq>(() => {
    const q = this.question();
    if (!isMcq(q)) {
      throw new Error(`[McqNotAnswered] Expected MCQ question, but received: ${q.type}`);
    }
    return q;
  });
  readonly questionNumber = input.required<number>();

  protected readonly choices = computed(() => {
    return [...this.mcq().choices].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  protected letter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
