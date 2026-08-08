import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';
import { Tag } from 'primeng/tag';

import { Question } from '@shared/models/quiz/question.model';

import { CreateQuizStore } from '../../stores/create-quiz.store';

@Component({
  selector: 'qn-questions-outline',
  imports: [Tag, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="questions-outline" aria-label="Questions outline">
      <header class="questions-outline__header">
        <h2>{{ tokens.INSTRUCTOR.QUESTIONS_OUTLINE | translate }}</h2>
        <div class="questions-outline__badges">
          <span class="questions-outline__counter">{{ store.questions().length }}</span>
          @if (store.effectiveRemainingMarks() !== null) {
            <span
              class="questions-outline__remaining"
              [class.questions-outline__remaining--zero]="store.effectiveRemainingMarks()! <= 0"
            >
              {{ store.effectiveRemainingMarks() }} {{ tokens.COMMON.POINTS | translate }}
            </span>
          }
        </div>
      </header>

      <ol class="questions-outline__list">
        @for (question of store.questions(); track question.id; let index = $index) {
          <li>
            <button
              class="questions-outline__item"
              [class.questions-outline__item--active]="question.id === store.activeQuestionId()"
              [attr.aria-current]="question.id === store.activeQuestionId() ? 'step' : null"
              (click)="onQuestionSelect(question.id)"
              type="button"
            >
              <span class="questions-outline__number">{{ index + 1 }}</span>
              <span class="questions-outline__details">
                <span class="questions-outline__title">{{ getQuestionTitle(question) }}</span>
                <span class="questions-outline__meta">
                  <p-tag
                    [severity]="getTagSeverity(question.type)"
                    [value]="question.type.toUpperCase()"
                    [icon]="getTagIcon(question.type)"
                  />
                  <span class="questions-outline__item-marks"
                    >• {{ question.marks }} {{ tokens.COMMON.POINTS | translate }}</span
                  >
                </span>
              </span>
            </button>
          </li>
        }
      </ol>
    </aside>
  `,
  styleUrl: './questions-outline.css',
})
export class QuestionsOutline {
  protected readonly tokens = TRANSLATION_TOKENS;
  protected readonly store = inject(CreateQuizStore);

  readonly questionSelected = output<string>();

  protected onQuestionSelect(questionId: string): void {
    this.questionSelected.emit(questionId);

    document.getElementById(questionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }

  protected getQuestionTitle(question: Question): string {
    const text = question.questionText.trim();
    return text.length > 0 ? text : 'Untitled question';
  }

  protected getTagSeverity(type: string): 'success' | 'info' | 'warn' | 'secondary' {
    switch (type) {
      case 'mcq':
        return 'success';
      case 'tf':
        return 'info';
      case 'essay':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  protected getTagIcon(type: string): string {
    switch (type) {
      case 'mcq':
        return 'pi pi-list-check';
      case 'tf':
        return 'pi pi-check-circle';
      case 'essay':
        return 'pi pi-file-edit';
      default:
        return 'pi pi-question-circle';
    }
  }
}
