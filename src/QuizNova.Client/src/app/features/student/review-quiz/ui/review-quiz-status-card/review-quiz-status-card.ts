import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ReviewQuizStore } from '../../review-quiz.store';

@Component({
  selector: 'qn-review-quiz-status-card',
  imports: [],
  template: `
    <section class="status-grid" aria-label="Attempt stats">
      <article class="status-card">
        <p class="status-card__label">Marks Earned</p>
        <p class="status-card__value">{{ marksEarned() }}</p>
      </article>

      <article class="status-card status-card--success">
        <p class="status-card__label">Correct</p>
        <p class="status-card__value">{{ correctAnswers }}</p>
      </article>

      <article class="status-card status-card--danger">
        <p class="status-card__label">Incorrect</p>
        <p class="status-card__value">{{ incorrectAnswers() }}</p>
      </article>

      <article class="status-card status-card--info">
        <p class="status-card__label">Time</p>
        <p class="status-card__value">{{ elapsedTime() }}</p>
      </article>
    </section>
  `,
  styleUrl: './review-quiz-status-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQuizStatusCard {
  private readonly reviewQuizStore = inject(ReviewQuizStore);

  protected readonly marksEarned = computed(() => {
    const attempt = this.reviewQuizStore.quizAttempt();
    return `${attempt?.score ?? 0}/${attempt?.totalMarks ?? 0}`;
  });

  protected readonly correctAnswers = this.reviewQuizStore.quizAttempt()?.correctAnswers;

  protected readonly incorrectAnswers = this.reviewQuizStore.incorrectAnswers;

  protected readonly elapsedTime = this.reviewQuizStore.elapsedMinutesLabel;
}
