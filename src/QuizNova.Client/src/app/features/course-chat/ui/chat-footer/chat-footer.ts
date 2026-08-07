import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { FieldError } from '@shared/components/field-error/field-error';
import { CustomValidators } from '@shared/validators/custom-validators';

import { CourseChatStore } from '../../course-chat.store';

@Component({
  selector: 'qn-chat-footer',
  standalone: true,
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <footer class="chat-footer">
      @if (store.replyingTo(); as reply) {
        <div class="replying-to-bar">
          <div class="replying-content">
            <span class="replying-label"
              >Replying to {{ reply.sender.personalInformation.name }}</span
            >
            <p class="replying-snippet">{{ reply.content.text }}</p>
          </div>
          <button class="cancel-reply-btn" (click)="store.cancelReply()" aria-label="Cancel reply">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }

      <div class="input-form">
        <input
          class="flex-1 chat-input"
          id="chat-message-input"
          [formControl]="messageControl"
          (keydown.enter)="sendMessage()"
          aria-label="Chat message"
          placeholder="Type a message..."
          type="text"
        />
        <button
          class="send-btn"
          [disabled]="messageControl.invalid"
          (click)="sendMessage()"
          aria-label="Send message"
        >
          <i class="fa-regular fa-paper-plane"></i>
        </button>
      </div>

      @if (messageControl.invalid && messageControl.touched) {
        @if (messageControl.hasError('maxlength')) {
          <qn-field-error id="message-maxlength-error"
            >Message cannot exceed 500 characters.</qn-field-error
          >
        }
      }
    </footer>
  `,
  styleUrl: './chat-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatFooter {
  readonly store = inject(CourseChatStore);
  readonly messageControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      CustomValidators.trimMinLength(1),
      CustomValidators.trimMaxLength(500),
    ],
  });

  sendMessage(): void {
    if (this.messageControl.invalid) return;
    this.store.sendChatMessage(this.messageControl.value.trim());
    this.messageControl.setValue('');
  }
}
