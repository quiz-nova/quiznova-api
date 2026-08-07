import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ProgressBar } from 'primeng/progressbar';

import { QuizAttemptStore } from '../../quiz-attempt.store';

@Component({
  selector: 'qn-questions-progress-bar',
  imports: [ProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="progress-card" aria-label="Quiz progress">
      <p-progressbar
        class="quiz-progress"
        [value]="progressValue()"
        [showValue]="false"
        aria-label="Solved questions progress"
      >
      </p-progressbar>

      <p class="progress-summary">
        {{ quizAttemptStore.numberOfSolvedQuestions() }} of
        {{ quizAttemptStore.numberOfQuestions() }} answered
      </p>
    </section>
  `,
  styleUrl: './questions-progress-bar.css',
})
export class QuestionsProgressBar {
  protected readonly quizAttemptStore = inject(QuizAttemptStore);
  protected readonly progressValue = computed(() => {
    const total = this.quizAttemptStore.numberOfQuestions();
    if (total === 0) {
      return 0;
    }

    return Math.round((this.quizAttemptStore.numberOfSolvedQuestions() / total) * 100);
  });
}
