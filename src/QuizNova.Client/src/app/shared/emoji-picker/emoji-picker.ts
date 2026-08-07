import {
  Component,
  ElementRef,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';

import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Overlay } from 'primeng/overlay';
import 'emoji-picker-element';

@Component({
  selector: 'qn-emoji-picker',
  imports: [InputText, Overlay, Button],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="picker-wrapper">
      <input
        #myInput
        [value]="value()"
        [placeholder]="placeholder()"
        (input)="valueChange.emit($any($event.target).value)"
        (keydown.enter)="send.emit()"
        type="text"
        pInputText
      />
      <p-button
        [text]="true"
        (onClick)="showEmojiPicker($event)"
        icon="fa-regular fa-face-smile"
        severity="secondary"
        type="button"
      />
      <p-overlay #emojiOverlay>
        <emoji-picker (emoji-click)="addEmoji($event)"></emoji-picker>
      </p-overlay>
    </div>
  `,
  styleUrl: './emoji-picker.css',
})
export class EmojiPicker {
  readonly value = input('');
  readonly placeholder = input('Type a message...');
  readonly valueChange = output<string>();
  readonly send = output<void>();

  @ViewChild('myInput') inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('emojiOverlay') emojiOverlay!: Overlay;

  showEmojiPicker(event: Event): void {
    this.emojiOverlay.show(event.target as HTMLElement);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- emoji-picker-element event
  addEmoji(event: any): void {
    const emoji = event.detail.unicode;
    const input = this.inputElement.nativeElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const currentText = input.value;
    const newText = currentText.substring(0, start) + emoji + currentText.substring(end);
    this.valueChange.emit(newText);
    this.emojiOverlay.hide();

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }
}
