import { DatePipe, UpperCasePipe, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChildren,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { AnswerReviewContract } from '@shared/models/quiz/question-component.contracts';
import { QuestionComponentMapperService } from '@shared/services/question-component-mapper.service';
import { QuizAttemptService } from '@shared/services/quiz-attempt.service';

import { NoAnswer } from './ui/no-answer/no-answer';

@Component({
  selector: 'qn-grade-review',
  imports: [
    ProgressSpinner,
    DatePipe,
    UpperCasePipe,
    NgComponentOutlet,
    NoAnswer,
    OperationFailed,
    Button,
  ],
  template: `
    <section class="page">
      <!-- ── Back nav ── -->
      <nav class="back-nav" aria-label="Breadcrumb">
        <p-button
          [outlined]="true"
          (onClick)="goBack()"
          aria-label="Back to Inbox"
          icon="fa-solid fa-arrow-left"
          label="Back to Inbox"
          severity="secondary"
          type="button"
        />
      </nav>

      @if (attemptResource.isLoading()) {
        <div class="status-container">
          <p-progress-spinner ariaLabel="Loading attempt" />
        </div>
      } @else if (attemptResource.error()) {
        <qn-operation-failed>
          <p>Failed to load this attempt.</p>
        </qn-operation-failed>
      } @else if (attempt()) {
        <!-- ── Header card ── -->
        <header class="attempt-header">
          <div class="header-main">
            <div
              class="header-badge"
              [class.pending]="attempt()!.status === 'Pending'"
              [class.completed]="attempt()!.status === 'Completed'"
            >
              <i class="fa-solid fa-circle-dot"></i>
              {{ attempt()!.status }}
            </div>
            <h1 class="quiz-title">{{ attempt()!.quizTitle }}</h1>
            <p class="submitted-on">
              <i class="fa-regular fa-calendar"></i>
              Submitted
              <time [attr.datetime]="attempt()!.submittedAt">{{
                attempt()!.submittedAt | date: 'short'
              }}</time>
            </p>
          </div>
          <div class="score-pill" aria-label="Current score">
            <span class="score-num">{{ attempt()!.score }}</span>
            <span class="score-lable">pts</span>
          </div>
        </header>

        <!-- ── Question list ── -->
        <ol class="question-list" aria-label="Quiz questions">
          @for (question of orderedQuestions(); track question.id; let i = $index) {
            @let answer = answerByQuestionId()[question.id];

            <li class="question-card">
              <!-- Question header -->
              <div class="question-header">
                <span class="q-number">Q{{ i + 1 }}</span>
                <span class="q-marks-badge"
                  >{{ question.marks }} {{ question.marks === 1 ? 'mark' : 'marks' }}</span
                >
                <span class="q-type-badge" [class]="'type-' + question.type">{{
                  question.type | uppercase
                }}</span>
              </div>
              <p class="question-text">{{ question.questionText }}</p>

              @if (!answer) {
                <qn-no-answer />
              } @else {
                <ng-container
                  [ngComponentOutlet]="
                    mapperService.getSuitableAnswerReviewComponent(question.type)
                  "
                  [ngComponentOutletInputs]="{ question, answer }"
                ></ng-container>
              }
            </li>
          }
        </ol>
      }
    </section>
  `,
  styleUrl: './grade-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeReview {
  private readonly outlets = viewChildren(NgComponentOutlet);

  constructor() {
    effect((onCleanup) => {
      const activeOutlets = this.outlets();
      const activeSubscriptions: { unsubscribe(): void }[] = [];

      activeOutlets.forEach((outlet) => {
        const instance = outlet.componentInstance as AnswerReviewContract | null;
        if (instance && instance.graded) {
          const subscription = instance.graded.subscribe(() => {
            this.reloadAttempt();
          });
          activeSubscriptions.push(subscription);
        }
      });

      onCleanup(() => {
        activeSubscriptions.forEach((sub) => sub.unsubscribe());
      });
    });
  }

  private readonly quizAttemptService = inject(QuizAttemptService);
  protected readonly mapperService = inject(QuestionComponentMapperService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly attemptId = this.route.snapshot.paramMap.get('attemptId') ?? '';

  protected readonly attemptResource = rxResource({
    stream: () => this.quizAttemptService.getQuizAttemptForGrading(this.attemptId),
  });

  protected readonly attempt = computed(() => this.attemptResource.value() ?? null);

  protected readonly orderedQuestions = computed(() =>
    [...(this.attempt()?.questions ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
  );

  protected readonly answerByQuestionId = computed(() => {
    const answers = this.attempt()?.answers ?? [];
    return Object.fromEntries(answers.map((a) => [a.questionId, a]));
  });

  public reloadAttempt(): void {
    this.attemptResource.reload();
  }

  protected goBack(): void {
    this.router.navigate(['/instructor/grade']);
  }
}
