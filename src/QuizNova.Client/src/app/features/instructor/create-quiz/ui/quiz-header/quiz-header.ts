import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CreateQuizStore } from '../../stores/create-quiz.store';

@Component({
  selector: 'qn-quiz-header',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="quiz-header-stats" aria-label="Quiz summary">
      <div class="stat-pill">
        <i class="fa-solid fa-rectangle-list stat-icon" aria-hidden="true"></i>
        <span>{{ numberOfQuestions() }} Questions</span>
      </div>

      <div class="stat-pill">
        <i class="fa-solid fa-arrow-trend-up stat-icon" aria-hidden="true"></i>
        <span>{{ totalMarks() }} Marks</span>
      </div>

      <div
        class="stat-pill"
        [class.stat-pill--warning]="remainingMarks() !== null && remainingMarks()! <= 0"
      >
        <i class="fa-solid fa-coins stat-icon" aria-hidden="true"></i>
        <span>{{ remainingMarks() !== null ? remainingMarks() : '—' }} Remaining</span>
      </div>
    </div>
  `,
  styleUrl: './quiz-header.css',
})
export class QuizHeader {
  private readonly store = inject(CreateQuizStore);

  protected readonly numberOfQuestions = this.store.numberOfQuestions;
  protected readonly totalMarks = this.store.totalMarks;
  protected readonly remainingMarks = this.store.effectiveRemainingMarks;
}
