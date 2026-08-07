import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { QuestionTagContract } from '@shared/models/quiz/question-component.contracts';
import { QuestionType } from '@shared/models/quiz/question.model';

@Component({
  selector: 'qn-essay-tag',
  imports: [],
  template: ` <p class="essay-tag">Text Response</p> `,
  styleUrl: './essay-tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayTag implements QuestionTagContract {
  readonly tag = signal(QuestionType.Essay).asReadonly();
}
