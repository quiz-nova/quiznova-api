import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { QuizAttemptStore } from '../../quiz-attempt.store';

@Component({
  selector: 'qn-quiz-attempt-header',
  imports: [],
  template: `
    <header class="attempt-header">
      <div>
        <h1>{{ quizAttemptStore.quizTitle() }}</h1>
        <p>
          Question {{ this.quizAttemptStore.currentQuestionIndex() }} of
          {{ quizAttemptStore.numberOfQuestions() }}
        </p>
      </div>

      <div class="attempt-meta" aria-label="Quiz status">
        <span class="chip"
          >{{ this.quizAttemptStore.numberOfSolvedQuestions() }}/{{
            quizAttemptStore.numberOfQuestions()
          }}</span
        >
        <span class="chip">{{ remainingTime() }}</span>
      </div>
    </header>
  `,
  styleUrl: './quiz-attempt-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizAttemptHeader {
  protected readonly quizAttemptStore = inject(QuizAttemptStore);

  // user-friendly remaining time in format mm:ss
  protected readonly remainingTime = computed(() => {
    const seconds = this.quizAttemptStore.remaningSeconds();
    const minutes = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secondsPart.toString().padStart(2, '0')}`;
  });
}
