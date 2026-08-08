import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'qn-no-course-chat-selected-placeholder',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="select-course-placeholder">
      <div class="placeholder-card">
        <div class="placeholder-icon">
          <i class="fa-solid fa-comments"></i>
        </div>
        <h3>{{ tokens.CHAT.COURSE_CHAT | translate }}</h3>
        <p>
          {{ tokens.CHAT.SELECT_CHAT | translate }}
        </p>
      </div>
    </div>
  `,
  styleUrl: './no-course-chat-selected-placeholder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoCourseChatSelectedPlaceholder {
  protected readonly tokens = TRANSLATION_TOKENS;
}
