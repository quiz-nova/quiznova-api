import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';

import { ProgressSpinner } from 'primeng/progressspinner';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { QuestionComponentMapperService } from '@shared/services/question-component-mapper.service';

import { ReviewQuizStore } from './review-quiz.store';
import { ResultBanner } from './ui/result-banner/result-banner';
import { ReviewQuizHeader } from './ui/review-quiz-header/review-quiz-header';
import { ReviewQuizStatusCard } from './ui/review-quiz-status-card/review-quiz-status-card';

@Component({
  selector: 'qn-review-quiz',
  imports: [
    ProgressSpinner,
    ReviewQuizHeader,
    ResultBanner,
    ReviewQuizStatusCard,
    NgComponentOutlet,
    OperationFailed,
  ],
  template: `
    <section class="review-page" aria-label="Quiz attempt review">
      @if (reviewQuizStore.isPending()('load')) {
        <div class="spinner">
          <p-progress-spinner ariaLabel="Loading attempt review" />
        </div>
      } @else if (reviewQuizStore.error()('load'); as errorMessage) {
        <qn-operation-failed>
          <p>{{ errorMessage }}</p>
        </qn-operation-failed>
      } @else if (reviewQuizStore.quizAttempt()) {
        <qn-review-quiz-header />

        <qn-result-banner />
        <qn-review-quiz-status-card />

        <section class="review-questions" aria-label="Question-by-question review">
          <h2 class="review-questions__title">Question-by-Question Review</h2>

          <div class="review-questions__list">
            @for (
              item of reviewQuizStore.questionReviewItems();
              track item.question.id;
              let i = $index
            ) {
              @if (item.answer) {
                <ng-container
                  [ngComponentOutlet]="
                    mapperService.getSuitableStudentAnswerReviewComponent(item.question.type)
                  "
                  [ngComponentOutletInputs]="{
                    question: item.question,
                    answer: item.answer,
                    questionNumber: i + 1,
                  }"
                ></ng-container>
              } @else {
                <ng-container
                  [ngComponentOutlet]="
                    mapperService.getSuitableQuestionNotAnsweredComponent(item.question.type)
                  "
                  [ngComponentOutletInputs]="{ question: item.question, questionNumber: i + 1 }"
                ></ng-container>
              }
            }
          </div>
        </section>
      } @else {
        <qn-operation-failed>
          <p>Attempt review is unavailable.</p>
        </qn-operation-failed>
      }
    </section>
  `,
  styleUrl: './review-quiz.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQuiz implements OnInit {
  protected readonly reviewQuizStore = inject(ReviewQuizStore);
  protected readonly mapperService = inject(QuestionComponentMapperService);

  readonly attemptId = input.required<string>();

  ngOnInit(): void {
    this.reviewQuizStore.load({ attemptId: this.attemptId() });
  }
}
