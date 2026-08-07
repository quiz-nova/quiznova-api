import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ReviewQuizStore } from '../../review-quiz.store';

@Component({
  selector: 'qn-result-banner',
  imports: [],
  template: `
    <section class="result-banner" aria-label="Attempt result summary">
      <div class="result-banner__icon" aria-hidden="true">📊</div>

      <div class="result-banner__content">
        <div class="result-banner__head">
          <p class="result-banner__score">{{ scorePercentage() }}%</p>
          <span class="result-banner__badge"> COMPLETED </span>
        </div>

        <p class="result-banner__message">
          Great work on completing your quiz attempt! Keep reviewing to improve your understanding.
        </p>

        <div class="result-banner__progress" role="presentation">
          <span
            [style.width.%]="scorePercentage()"
            [attr.aria-label]="'Score ' + scorePercentage() + '%'"
          >
          </span>
        </div>
      </div>
    </section>
  `,
  styleUrl: './result-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultBanner {
  private readonly reviewQuizStore = inject(ReviewQuizStore);
  protected readonly scorePercentage = this.reviewQuizStore.scorePercentage;
}
