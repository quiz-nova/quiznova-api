import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';

import { Button } from 'primeng/button';

import { CreateQuizStore } from '../../stores/create-quiz.store';

@Component({
  selector: 'qn-quiz-publish-panel',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="publish-group">
      <p-button
        [disabled]="!store.isEntireQuizValid()"
        (onClick)="publish.emit()"
        icon="pi pi-check-circle"
        label="Publish Quiz"
        severity="success"
        type="button"
      />
      @if (!store.isEntireQuizValid()) {
        <span class="publish-hint">{{ store.publishDisabledReason() }}</span>
      }
    </div>
  `,
  styleUrl: './quiz-publish-panel.css',
})
export class QuizPublishPanel {
  readonly store = inject(CreateQuizStore);
  readonly publish = output<void>();
}
