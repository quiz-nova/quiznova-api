import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { shortId } from '@shared/utils/utilities';

import { ReviewQuizStore } from '../../review-quiz.store';

@Component({
  selector: 'qn-review-quiz-header',
  imports: [DatePipe],
  template: `
    <header class="review-header">
      <h1 class="review-header__title">Attempt Review</h1>
      <p class="review-header__subtitle">{{ reviewQuizStore.quizAttempt()?.quizTitle }}</p>

      <div class="review-header__meta">
        <span class="review-header__chip">{{ shortAttemptId() }}</span>
        <time
          class="review-header__chip"
          [attr.datetime]="reviewQuizStore.quizAttempt()?.submittedAt"
        >
          {{ reviewQuizStore.quizAttempt()?.submittedAt | date: 'short' }}
        </time>
      </div>
    </header>
  `,
  styleUrl: './review-quiz-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQuizHeader {
  protected readonly reviewQuizStore = inject(ReviewQuizStore);

  protected readonly shortAttemptId = computed(() => {
    const id = this.reviewQuizStore.quizAttempt()?.quizAttemptId;
    return id ? `Attempt ${shortId(id)}` : '';
  });
}
