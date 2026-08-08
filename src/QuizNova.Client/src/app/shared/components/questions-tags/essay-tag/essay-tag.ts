import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

import { QuestionTagContract } from '@shared/models/quiz/question-component.contracts';
import { QuestionType } from '@shared/models/quiz/question.model';

@Component({
  selector: 'qn-essay-tag',
  imports: [TranslatePipe],
  template: ` <p class="essay-tag">{{ tokens.COMMON.TEXT_RESPONSE_TAG | translate }}</p> `,
  styleUrl: './essay-tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayTag implements QuestionTagContract {
  protected readonly tokens = TRANSLATION_TOKENS;
  readonly tag = signal(QuestionType.Essay).asReadonly();
}
