import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StudentAnswerReviewContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { Essay, isEssay } from '@shared/models/quiz/questions/essay.model';
import {
  EssayAnswer,
  isEssayAnswer,
  QuestionAnswer,
} from '@shared/models/quiz-attempt/question-answer.model';

@Component({
  selector: 'qn-student-essay-answer-review',
  imports: [],
  template: `
    <article
      class="review-question"
      [class.review-question--graded]="isGraded()"
      [class.review-question--pending]="!isGraded()"
      aria-label="Reviewed essay question"
    >
      <header class="review-question__header">
        <div class="review-question__meta">
          <span class="review-question__index">Q{{ questionNumber() }}</span>
          <span class="review-question__type">Essay</span>
        </div>

        @if (isGraded()) {
          <span
            class="review-question__marks"
            [class.review-question__marks--success]="score() > 0"
          >
            +{{ score() }}/{{ essay().marks }} pt
          </span>
        } @else {
          <span class="review-question__marks review-question__marks--pending">
            Pending Grade
          </span>
        }
      </header>

      <p class="review-question__text">{{ essay().questionText }}</p>

      <div class="review-question__answers">
        <!-- Student's Response -->
        <div class="review-answer review-answer--student">
          <p class="review-answer__label"><i class="fa-solid fa-pen-nib"></i> Your response</p>
          <blockquote class="review-answer__value">
            {{ essayAnswer().studentResponse || 'No response provided.' }}
          </blockquote>
        </div>

        <!-- Reference Answer -->
        @if (essay().answerReference) {
          <div class="review-answer review-answer--reference">
            <p class="review-answer__label">
              <i class="fa-solid fa-lightbulb"></i> Reference answer
            </p>
            <p class="review-answer__value">{{ essay().answerReference }}</p>
          </div>
        }

        <!-- Instructor Feedback -->
        @if (essayAnswer().feedback) {
          <div class="review-answer review-answer--feedback">
            <p class="review-answer__label">
              <i class="fa-solid fa-comment-dots"></i> Teacher's feedback
            </p>
            <blockquote class="review-answer__value review-answer__value--feedback">
              {{ essayAnswer().feedback }}
            </blockquote>
          </div>
        }
      </div>
    </article>
  `,
  styleUrl: './essay-answer-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEssayAnswerReview implements StudentAnswerReviewContract {
  readonly question = input.required<Question>();
  readonly answer = input.required<QuestionAnswer>();
  readonly questionNumber = input.required<number>();

  protected readonly essay = computed<Essay>(() => {
    const q = this.question();
    if (!isEssay(q)) {
      throw new Error(
        `[StudentEssayAnswerReview] Expected Essay question, but received: ${q.type}`,
      );
    }
    return q;
  });
  protected readonly essayAnswer = computed<EssayAnswer>(() => {
    const a = this.answer();
    if (!isEssayAnswer(a)) {
      throw new Error(
        `[StudentEssayAnswerReview] Expected EssayAnswer, but received: ${a.answerType}`,
      );
    }
    return a;
  });

  protected readonly isGraded = computed(
    () => this.essayAnswer().score !== null && this.essayAnswer().score !== undefined,
  );
  protected readonly score = computed(() => this.essayAnswer().score ?? 0);
}
