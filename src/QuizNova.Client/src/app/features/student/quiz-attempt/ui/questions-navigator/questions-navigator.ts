import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { QuizAttemptStore } from '../../quiz-attempt.store';

@Component({
  selector: 'qn-questions-navigator',
  imports: [],
  template: `
    <section class="navigator-card" aria-label="Question navigator">
      <h2>Question Navigator</h2>

      <div class="navigator-grid">
        @for (question of quizAttemptStore.quizQuestions(); track $index) {
          <button
            [class.is-current]="$index === quizAttemptStore.currentQuestionIndex()"
            [class.is-flagged]="question.isFlagged"
            [class.is-solved]="question.isSolved"
            (click)="onClick($index)"
            type="button"
          >
            {{ $index + 1 }}
          </button>
        }
      </div>

      <ul class="legend" aria-label="Question status legend">
        <li><span class="dot answered"></span>Answered</li>
        <li><span class="dot unanswered"></span>Unanswered</li>
        <li><span class="dot flagged"></span>Flagged</li>
      </ul>
    </section>
  `,
  styleUrl: './questions-navigator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsNavigator {
  protected readonly quizAttemptStore = inject(QuizAttemptStore);

  onClick(index: number) {
    this.quizAttemptStore.setCurrentQuestionIndex(index);
  }
}
