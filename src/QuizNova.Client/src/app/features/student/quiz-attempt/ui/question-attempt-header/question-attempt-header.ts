import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { QuestionType } from '@shared/models/quiz/question.model';
import { QuestionComponentMapperService } from '@shared/services/question-component-mapper.service';

import { QuizAttemptStore } from '../../quiz-attempt.store';

@Component({
  selector: 'qn-question-attempt-header',
  imports: [NgComponentOutlet],
  template: `
    <header class="question-attempt-header">
      <ng-container
        [ngComponentOutlet]="mapperService.getSuitableQuestionTag(questionType())"
      ></ng-container>

      <button
        class="flag btn"
        [class.flagged]="quizAttemptStore.isCurrentQuestionFlagged()"
        (click)="onClickFlag()"
        type="button"
        aria-label="Flag question"
      >
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        @if (quizAttemptStore.isCurrentQuestionFlagged()) {
          <span>Unflag</span>
        } @else {
          <span>Flag</span>
        }
      </button>
    </header>
  `,
  styleUrl: './question-attempt-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAttemptHeader {
  protected readonly mapperService = inject(QuestionComponentMapperService);
  protected quizAttemptStore = inject(QuizAttemptStore);
  readonly questionType = input.required<QuestionType>();
  onClickFlag(): void {
    this.quizAttemptStore.changeFlagStatusForTheCurrentQuestion();
  }
}
