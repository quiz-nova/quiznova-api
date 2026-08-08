import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

import { CourseChatStore } from '../../course-chat.store';

@Component({
  selector: 'qn-chat-header',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <header class="chat-header">
      <div class="course-info">
        <h2>{{ tokens.CHAT.COURSE_CHAT | translate }}</h2>
        <div class="connection-status" [class.connected]="store.isConnected()">
          <span class="status-indicator"></span>
          {{
            store.isConnected()
              ? (tokens.CHAT.CONNECTED | translate)
              : (tokens.CHAT.CONNECTING | translate)
          }}
        </div>
      </div>
    </header>
  `,
  styleUrl: './chat-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHeader {
  protected readonly tokens = TRANSLATION_TOKENS;
  readonly store = inject(CourseChatStore);
}
