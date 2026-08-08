import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { ConfirmActionModal } from '@shared/components/confirm-action-modal/confirm-action-modal';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { ObserveVisibilityDirective } from '@shared/directives/observe-visibility.directive';
import { QuestionFormContract } from '@shared/models/quiz/question-component.contracts';
import { QuestionComponentMapperService } from '@shared/services/question-component-mapper.service';

import { CreateQuizStore } from './stores/create-quiz.store';
import { AddQuestion } from './ui/add-question/add-question';
import { NoQuestions } from './ui/no-questions/no-questions';
import { QuestionHeader } from './ui/question-header/question-header';
import { QuestionsOutline } from './ui/questions-outline/questions-outline';
import { QuestionsOutlinePlaceholder } from './ui/questions-outline-placeholder/questions-outline-placeholder';
import { QuizHeader } from './ui/quiz-header/quiz-header';
import { QuizMetadataForm } from './ui/quiz-metadata-form/quiz-metadata-form';
import { QuizPublishPanel } from './ui/quiz-publish-panel/quiz-publish-panel';

@Component({
  selector: 'qn-create-quiz',
  imports: [
    AddQuestion,
    QuestionHeader,
    QuizHeader,
    NoQuestions,
    QuizMetadataForm,
    ObserveVisibilityDirective,
    QuestionsOutline,
    QuestionsOutlinePlaceholder,
    QuizPublishPanel,
    NgComponentOutlet,
    RoleDashboardHeader,
    ConfirmActionModal,
    TranslatePipe,
  ],
  template: `
    <section class="create-quiz">
      <div class="outline">
        @if (createQuizStore.numberOfQuestions() > 0) {
          <qn-questions-outline
            (questionSelected)="createQuizStore.setCurrentQuestionId($event)"
          ></qn-questions-outline>
        } @else {
          <qn-questions-outline-placeholder />
        }
      </div>
      <main class="main">
        <header class="header">
          <qn-role-dashboard-header
            [title]="tokens.INSTRUCTOR.CREATE_QUIZ_TITLE | translate"
            [description]="tokens.INSTRUCTOR.CREATE_QUIZ_DESC | translate"
          />
          <qn-quiz-publish-panel (publish)="onPublishQuiz()" />
        </header>
        <qn-quiz-metadata-form
          (formReady)="createQuizStore.registerForm($event)"
          (formDestroyed)="createQuizStore.unregisterForm($event)"
          (valueChange)="createQuizStore.setHeaderMetadata($event)"
          (courseIdChanged)="onCourseIdChanged($event)"
        ></qn-quiz-metadata-form>
        <qn-quiz-header />
        <div class="questions-workspace">
          <div class="questions-content">
            <div class="questions-list">
              @for (
                question of createQuizStore.quiz().questions;
                track question.id;
                let index = $index
              ) {
                <div
                  class="question"
                  [id]="question.id"
                  [threshold]="0.45"
                  (visible)="onQuestionVisibilityChanged($event, question.id)"
                  qnObserveVisibility
                  animate.enter="element-enter"
                  animate.leave="element-leave"
                >
                  <qn-question-header
                    [index]="index"
                    [question]="question"
                    [maxMarks]="getMaxMarksForQuestion(question.marks)"
                    (deleteQuestion)="createQuizStore.removeQuestion($event)"
                    (marksChange)="
                      createQuizStore.updateQuestionMarks($event.questionId, $event.marks)
                    "
                  >
                    <ng-container
                      [ngComponentOutlet]="mapperService.getSuitableQuestionTag(question.type)"
                    ></ng-container>
                  </qn-question-header>

                  <ng-container
                    [ngComponentOutlet]="
                      mapperService.getSuitableQuestionFormComponent(question.type)
                    "
                    [ngComponentOutletInputs]="{ initialData: question }"
                  ></ng-container>
                </div>
              }
            </div>

            <div
              class="add-question-main"
              (visible)="onAddQuestionButtonVisible($event)"
              qnObserveVisibility
            >
              <qn-add-question
                (questionAdded)="createQuizStore.addQuestion($event)"
              ></qn-add-question>
            </div>
            @if (!isAddQuestionButtonVisible()) {
              <div class="add-question-sticky-container">
                <qn-add-question
                  class="pill-style"
                  (questionAdded)="createQuizStore.addQuestion($event)"
                  animate.leave="float-add-question-button-leave"
                  animate.enter="float-add-question-button-enter"
                >
                </qn-add-question>
              </div>
            }
            @if (createQuizStore.numberOfQuestions() === 0) {
              <qn-no-questions></qn-no-questions>
            }
          </div>
        </div>
      </main>
    </section>

    @if (showConfirmModal()) {
      <qn-confirm-action-modal
        (confirmed)="onLeave(true)"
        (cancelled)="onLeave(false)"
        title="Leave Quiz Builder"
        warningMessage="You have unsaved quiz content. If you leave now, all your work will be lost."
        confirmationPhrase="leave"
        confirmButtonText="I understand, leave"
      />
    }

    @if (showPublishConfirmModal()) {
      <qn-confirm-action-modal
        (confirmed)="onConfirmPublish()"
        (cancelled)="onCancelPublish()"
        title="Publish Quiz"
        warningMessage="You are about to publish this quiz. Once published, it will be visible to students enrolled in the course."
        confirmationPhrase="publish"
        confirmButtonText="Yes, Publish Quiz"
        variant="success"
      />
    }
  `,
  styleUrl: './create-quiz.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CreateQuizStore],
})
export class CreateQuiz {
  protected readonly tokens = TRANSLATION_TOKENS;
  protected readonly mapperService = inject(QuestionComponentMapperService);
  protected readonly createQuizStore = inject(CreateQuizStore);
  private readonly messageService = inject(MessageService);
  protected readonly isAddQuestionButtonVisible = signal(true);

  protected readonly showConfirmModal = signal(false);
  protected readonly showPublishConfirmModal = signal(false);
  private readonly router = inject(Router);
  private resolveLeave: ((allow: boolean) => void) | null = null;
  private hasBeenPublished = false;

  private readonly formOutlets = viewChildren(NgComponentOutlet);

  constructor() {
    effect((onCleanup) => {
      const activeOutlets = this.formOutlets();
      const activeSubscriptions: { unsubscribe(): void }[] = [];

      activeOutlets.forEach((outlet) => {
        const instance = outlet.componentInstance as QuestionFormContract | null;
        if (instance) {
          if (instance.formReady) {
            activeSubscriptions.push(
              instance.formReady.subscribe((form) => this.createQuizStore.registerForm(form)),
            );
          }
          if (instance.formDestroyed) {
            activeSubscriptions.push(
              instance.formDestroyed.subscribe((form) => this.createQuizStore.unregisterForm(form)),
            );
          }
          if (instance.valueChange) {
            activeSubscriptions.push(
              instance.valueChange.subscribe((q) => this.createQuizStore.updateQuestion(q)),
            );
          }
          if (instance.blurEvent) {
            activeSubscriptions.push(
              instance.blurEvent.subscribe((q) => this.createQuizStore.updateQuestion(q)),
            );
          }
          if (instance.questionTextBlur) {
            activeSubscriptions.push(
              instance.questionTextBlur.subscribe((event) =>
                this.createQuizStore.updateQuestionText(event.questionId, event.text),
              ),
            );
          }
          if (instance.deleteChoice) {
            activeSubscriptions.push(
              instance.deleteChoice.subscribe((event) =>
                this.createQuizStore.deleteChoiceFromMcq(event.questionId, event.choiceId),
              ),
            );
          }
        }
      });

      onCleanup(() => {
        activeSubscriptions.forEach((sub) => sub.unsubscribe());
      });
    });
  }

  canDeactivate(): Promise<boolean> {
    if (this.hasBeenPublished) return Promise.resolve(true);

    const quiz = this.createQuizStore.quiz();
    if (!quiz.questions.length && !quiz.title && !quiz.courseId) return Promise.resolve(true);

    this.showConfirmModal.set(true);
    return new Promise<boolean>((resolve) => {
      this.resolveLeave = resolve;
    });
  }

  protected onLeave(allow: boolean): void {
    this.showConfirmModal.set(false);
    this.resolveLeave?.(allow);
    this.resolveLeave = null;
  }

  protected onPublishQuiz() {
    if (this.createQuizStore.validateAll()) {
      this.showPublishConfirmModal.set(true);
    }
  }

  protected onConfirmPublish() {
    this.showPublishConfirmModal.set(false);
    this.createQuizStore.publishQuiz({
      onSuccess: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Quiz Published',
          detail: 'Your quiz has been published successfully.',
        });
        this.hasBeenPublished = true;
        this.router.navigate(['/instructor/my-courses']);
      },
      onError: (message) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Publish Failed',
          detail: message,
        });
      },
    });
  }

  protected onCancelPublish() {
    this.showPublishConfirmModal.set(false);
  }

  protected onCourseIdChanged(courseId: string) {
    this.createQuizStore.updateCourseId(courseId);
  }

  protected onAddQuestionButtonVisible(isVisible: boolean) {
    this.isAddQuestionButtonVisible.set(isVisible);
  }

  protected onQuestionVisibilityChanged(isVisible: boolean, questionId: string) {
    if (!isVisible) {
      return;
    }

    this.createQuizStore.setCurrentQuestionId(questionId);
  }

  protected getMaxMarksForQuestion(currentMarks: number): number {
    const effectiveRemaining = this.createQuizStore.effectiveRemainingMarks();
    if (effectiveRemaining === null) {
      return 5;
    }
    return Math.min(5, currentMarks + effectiveRemaining);
  }
}
