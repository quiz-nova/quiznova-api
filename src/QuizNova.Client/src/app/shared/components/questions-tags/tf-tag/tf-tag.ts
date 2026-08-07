import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { QuestionTagContract } from '@shared/models/quiz/question-component.contracts';
import { QuestionType } from '@shared/models/quiz/question.model';

@Component({
  selector: 'qn-tf-tag',
  imports: [],
  template: ` <p class="question-tag">{{ tag() }}</p> `,
  styleUrl: './tf-tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfTag implements QuestionTagContract {
  readonly tag = signal(QuestionType.Tf).asReadonly();
}
