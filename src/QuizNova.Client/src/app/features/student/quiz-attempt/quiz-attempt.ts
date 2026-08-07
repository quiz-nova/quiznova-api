import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { map } from 'rxjs';

import { ConfirmActionModal } from '@shared/components/confirm-action-modal/confirm-action-modal';
import { NavigationButtons } from '@shared/components/navigation-buttons/navigation-buttons';
import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { QuestionComponentMapperService } from '@shared/services/question-component-mapper.service';

import { QuizAttemptStore } from './quiz-attempt.store';
import { QuestionAttemptHeader } from './ui/question-attempt-header/question-attempt-header';
import { QuestionsNavigator } from './ui/questions-navigator/questions-navigator';
import { QuestionsProgressBar } from './ui/questions-progress-bar/questions-progress-bar';
import { QuizAttemptHeader } from './ui/quiz-attempt-header/quiz-attempt-header';
import { QuizFinishedMessage } from './ui/quiz-finished-message/quiz-finished-message';

@Component({
  selector: 'qn-quiz-attempt',
  host: {
    '(window:beforeunload)': 'unloadNotification($event)',
  },
  imports: [
    QuizAttemptHeader,
    QuestionsNavigator,
    NavigationButtons,
    QuestionAttemptHeader,
    NgComponentOutlet,
    QuestionsProgressBar,
    ProgressSpinner,
    OperationFailed,
    Button,
    QuizFinishedMessage,
    ConfirmActionModal,
  ],
  providers: [QuizAttemptStore],
  template: `
    <section class="attempt-layout" aria-label="Quiz attempt layout">
      @if (quizAttemptStore.isPending()('load')) {
        <div class="spinner-container">
          <p-progress-spinner ariaLabel="Loading quiz attempt" />
        </div>
      } @else if (quizAttemptStore.error()('load'); as errorMessage) {
        <qn-operation-failed>
          <p>{{ errorMessage }}</p>
        </qn-operation-failed>
      } @else if (quizAttemptStore.isFulfilled()('submit')) {
        <qn-quiz-finished-message (seeResults)="goToResults()" />
      } @else {
        <qn-quiz-attempt-header />

        @if (quizAttemptStore.error()('submit'); as submitErrorMessage) {
          <qn-operation-failed>
            <p>{{ submitErrorMessage }}</p>
          </qn-operation-failed>
        }

        @if (quizAttemptStore.error()('submit-answer'); as submitAnswerErrorMessage) {
          <qn-operation-failed>
            <p>{{ submitAnswerErrorMessage }}</p>
          </qn-operation-failed>
        }

        @if (quizAttemptStore.error()('start'); as startErrorMessage) {
          <qn-operation-failed>
            <p>{{ startErrorMessage }}</p>
          </qn-operation-failed>
        }

        <div class="attempt-main">
          <div class="question-column" aria-label="Question area">
            @let question =
              quizAttemptStore.quizQuestions()[quizAttemptStore.currentQuestionIndex()];

            <qn-question-attempt-header [questionType]="question.type"></qn-question-attempt-header>

            <ng-container
              [ngComponentOutlet]="
                questionMapperService.getSuitableQuestionAttemptComponent(question.type)
              "
              [ngComponentOutletInputs]="{
                question: question,
              }"
            ></ng-container>

            <qn-navigation-buttons
              [canGoPrevious]="quizAttemptStore.canGoPrevious()"
              [canGoNext]="quizAttemptStore.canGoNext()"
              (previousButtonClicked)="quizAttemptStore.GoToPreviousQuestion()"
              (nextButtonClicked)="quizAttemptStore.GoToNextQuestion()"
              ariaLabel="Question navigation"
            />

            <p-button
              [disabled]="!quizAttemptStore.currentAnswerDraft() || quizAttemptStore.quizTimeOut()"
              [loading]="quizAttemptStore.isPending()('submit-answer')"
              [label]="savedLabel() ?? 'Save Answer'"
              (onClick)="quizAttemptStore.saveCurrentAnswer()"
              severity="success"
              type="button"
            />
          </div>

          <aside class="sidebar-column" aria-label="Quiz tools">
            <qn-questions-navigator />
            <qn-questions-progress-bar />
            <p-button
              [fluid]="true"
              [loading]="quizAttemptStore.isPending()('submit')"
              (onClick)="onSubmitQuiz()"
              label="Submit Quiz"
              severity="danger"
              type="button"
            />
          </aside>
        </div>
      }

      @if (showLeaveConfirmModal()) {
        <qn-confirm-action-modal
          (confirmed)="onLeave(true)"
          (cancelled)="onLeave(false)"
          title="Leave Quiz"
          warningMessage="Are you sure you want to leave? Your progress will be saved."
          confirmationPhrase="leave"
          confirmButtonText="I understand, leave"
          variant="danger"
        />
      }

      @if (showSubmitConfirmModal()) {
        <qn-confirm-action-modal
          (confirmed)="onConfirmSubmit()"
          (cancelled)="showSubmitConfirmModal.set(false)"
          title="Submit Quiz"
          warningMessage="Are you sure you want to submit your quiz? You will not be able to edit your answers after this."
          confirmationPhrase="submit"
          confirmButtonText="Yes, Submit Quiz"
          variant="success"
        />
      }
    </section>
  `,
  styleUrl: './quiz-attempt.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizAttempt implements OnInit {
  protected readonly questionMapperService = inject(QuestionComponentMapperService);
  protected readonly quizId = input.required<string>();
  protected readonly quizAttemptStore = inject(QuizAttemptStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly showLeaveConfirmModal = signal(false);
  protected readonly showSubmitConfirmModal = signal(false);
  private resolveLeave: ((allow: boolean) => void) | null = null;

  protected readonly savedLabel = computed(() => {
    const lastSaved = this.quizAttemptStore.lastSavedAt();
    if (!lastSaved) return null;

    const elapsed = Date.now() - lastSaved;
    if (elapsed > 3000) return null;

    return '\u2713 Saved';
  });

  private readonly attemptId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('attemptId'))),
  );

  ngOnInit() {
    this.quizAttemptStore.load({
      quizId: this.quizId(),
      attemptId: this.attemptId(),
    });
  }

  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.isQuizInProgress()) {
      $event.preventDefault();
    }
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (this.isQuizInProgress()) {
      this.showLeaveConfirmModal.set(true);
      return new Promise<boolean>((resolve) => {
        this.resolveLeave = resolve;
      });
    }
    return true;
  }

  protected onLeave(allow: boolean): void {
    this.showLeaveConfirmModal.set(false);
    this.resolveLeave?.(allow);
    this.resolveLeave = null;
  }

  protected onSubmitQuiz(): void {
    this.showSubmitConfirmModal.set(true);
  }

  protected onConfirmSubmit(): void {
    this.showSubmitConfirmModal.set(false);
    this.quizAttemptStore.completeAttempt();
  }

  protected goToResults(): void {
    this.router.navigate(['/student/results']);
  }

  private isQuizInProgress(): boolean {
    const store = this.quizAttemptStore;
    const isLoaded = !store.isPending()('load') && !store.error()('load');
    const isSubmitted = store.isFulfilled()('submit');
    return isLoaded && !isSubmitted;
  }
}
