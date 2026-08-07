import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { Button } from 'primeng/button';

@Component({
  selector: 'qn-quiz-finished-message',
  imports: [Button],
  template: `
    <div class="quiz-completed-card">
      <div class="quiz-completed-card__icon">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h2 class="quiz-completed-card__title">Quiz Completed!</h2>
      <p class="quiz-completed-card__message">
        You Have Compelete the Quiz Take a Rest Before you See you results 😉
      </p>
      <p-button
        (onClick)="seeResults.emit()"
        label="See Results"
        severity="success"
        type="button"
      />
    </div>
  `,
  styleUrl: './quiz-finished-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizFinishedMessage {
  seeResults = output<void>();
}
