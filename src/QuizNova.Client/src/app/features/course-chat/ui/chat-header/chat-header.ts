import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CourseChatStore } from '../../course-chat.store';

@Component({
  selector: 'qn-chat-header',
  standalone: true,
  template: `
    <header class="chat-header">
      <div class="course-info">
        <h2>Course Chat</h2>
        <div class="connection-status" [class.connected]="store.isConnected()">
          <span class="status-indicator"></span>
          {{ store.isConnected() ? 'Connected' : 'Connecting...' }}
        </div>
      </div>
    </header>
  `,
  styleUrl: './chat-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHeader {
  readonly store = inject(CourseChatStore);
}
