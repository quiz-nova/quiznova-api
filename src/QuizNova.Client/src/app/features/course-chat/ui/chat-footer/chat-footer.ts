import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';

import { FieldError } from '@shared/components/field-error/field-error';
import { CustomValidators } from '@shared/validators/custom-validators';

import { CourseChatStore } from '../../course-chat.store';

@Component({
  selector: 'qn-chat-footer',
  standalone: true,
  imports: [ReactiveFormsModule, FieldError, TranslatePipe],
  template: `
    <footer class="chat-footer">
      @if (store.replyingTo(); as reply) {
        <div class="replying-to-bar">
          <div class="replying-content">
            <span class="replying-label">{{
              tokens.CHAT.REPLYING_TO | translate: { name: reply.sender.personalInformation.name }
            }}</span>
            <p class="replying-snippet">{{ reply.content.text }}</p>
          </div>
          <button
            class="cancel-reply-btn"
            [attr.aria-label]="tokens.CHAT.CANCEL_REPLY | translate"
            (click)="store.cancelReply()"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }

      <div class="input-form">
        <input
          class="flex-1 chat-input"
          id="chat-message-input"
          [formControl]="messageControl"
          [attr.aria-label]="tokens.CHAT.TYPE_MESSAGE | translate"
          [placeholder]="tokens.CHAT.TYPE_MESSAGE | translate"
          (keydown.enter)="sendMessage()"
          type="text"
        />
        <button
          class="send-btn"
          [disabled]="messageControl.invalid"
          [attr.aria-label]="tokens.CHAT.SEND_MESSAGE | translate"
          (click)="sendMessage()"
        >
          <i class="fa-regular fa-paper-plane"></i>
        </button>
      </div>

      @if (messageControl.invalid && messageControl.touched) {
        @if (messageControl.hasError('maxlength')) {
          <qn-field-error id="message-maxlength-error">{{
            tokens.CHAT.MAX_CHAT_LENGTH | translate
          }}</qn-field-error>
        }
      }
    </footer>
  `,
  styleUrl: './chat-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatFooter {
  protected readonly tokens = TRANSLATION_TOKENS;
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
