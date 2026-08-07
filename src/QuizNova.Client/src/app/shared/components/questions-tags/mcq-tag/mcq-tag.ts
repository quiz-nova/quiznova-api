import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { QuestionTagContract } from '@shared/models/quiz/question-component.contracts';
import { QuestionType } from '@shared/models/quiz/question.model';

@Component({
  selector: 'qn-mcq-tag',
  imports: [],
  template: ` <p class="mcq-tag">{{ tag() }}</p> `,
  styleUrl: './mcq-tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McqTag implements QuestionTagContract {
  readonly tag = signal(QuestionType.Mcq).asReadonly();
}
