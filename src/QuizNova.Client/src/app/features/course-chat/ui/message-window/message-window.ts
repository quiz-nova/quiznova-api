import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';

import { Message } from '@shared/models/chat/chat.model';
import { UserRole } from '@shared/models/users/user-role.model';

import { CourseChatStore } from '../../course-chat.store';
import { ReactionList } from '../reaction-list/reaction-list';

@Component({
  selector: 'qn-message-window',
  standalone: true,
  imports: [CommonModule, ReactionList],
  template: `
    <div class="messages-window" #scrollContainer>
      @if (store.isPending()('loadChatRoom')) {
        <div class="centered-state">
          <i class="fa-solid fa-spinner fa-spin"></i> Loading message history...
        </div>
      } @else if (store.messages().length === 0) {
        <div class="centered-state">No messages yet. Start the conversation!</div>
      } @else {
        <div class="messages-list">
          @for (msg of store.messages(); track msg.id) {
            <div class="message-wrapper" [class.outgoing]="msg.sender.id === store.userId()">
              <div class="message-avatar">
                {{ msg.sender.personalInformation.name.charAt(0).toUpperCase() }}
              </div>
              <div class="message-meta-container">
                <div class="message-sender-info">
                  <span class="sender-name">{{ msg.sender.personalInformation.name }}</span>
                  <span
                    class="role-badge"
                    [class.instructor]="msg.sender.role === UserRole.instructor"
                  >
                    {{ msg.sender.role }}
                  </span>
                  <time class="message-time" [attr.datetime]="msg.createdAt">
                    {{ msg.createdAt | date: 'shortTime' }}
                  </time>
                </div>

                @if (msg.replyOnId) {
                  @if (getMessageById(msg.replyOnId); as repliedMsg) {
                    <div class="replied-preview">
                      <span class="replied-sender">
                        {{ repliedMsg.sender.personalInformation.name }}
                      </span>
                      <p class="replied-text">
                        {{ repliedMsg.content.text }}
                      </p>
                    </div>
                  }
                }

                <div class="message-bubble-row">
                  <div class="message-bubble">
                    <p class="message-text">{{ msg.content.text }}</p>
                  </div>

                  <div class="bubble-actions">
                    <button class="action-btn" (click)="store.setReplyTo(msg)" title="Reply">
                      <i class="fa-solid fa-reply"></i>
                    </button>
                  </div>
                </div>

                <qn-reaction-list [message]="msg" />
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './message-window.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageWindow {
  readonly store = inject(CourseChatStore);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  readonly UserRole = UserRole;

  constructor() {
    effect(() => {
      this.store.messages();
      this.scrollToBottom();
    });
  }

  getMessageById(id: string): Message | undefined {
    return this.store.messages().find((m) => m.id === id);
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.scrollContainer) {
          this.scrollContainer.nativeElement.scrollTop =
            this.scrollContainer.nativeElement.scrollHeight;
        }
      });
    } catch (err) {
      console.debug(err);
    }
  }
}
