import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';
import { SharedModule } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'qn-confirm-action-modal',
  imports: [FormsModule, Dialog, Button, InputText, SharedModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="true"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="true"
      (onHide)="onCancel()"
      styleClass="confirm-dialog"
    >
      <ng-template pTemplate="header">
        <div class="modal-header">
          <i [class]="headerIconClass()" aria-hidden="true"></i>
          <h3 id="confirm-modal-title">{{ title() }}</h3>
        </div>
      </ng-template>

      <div class="modal-body">
        <p [class]="'modal-warning-text ' + variant()">
          <i [class]="bodyIconClass()" aria-hidden="true"></i>
          {{ warningMessage() }}
        </p>
        <p class="modal-instruction">
          {{ tokens.COMMON.TO_CONFIRM_TYPE | translate }}
          <strong>{{ confirmationPhrase() }}</strong> {{ tokens.COMMON.BELOW_COLON | translate }}
        </p>
        <input
          class="modal-confirm-input"
          id="confirm-action-input"
          [(ngModel)]="confirmationInput"
          [placeholder]="tokens.COMMON.CONFIRM_PHRASE_PLACEHOLDER | translate"
          pInputText
          type="text"
          autocomplete="off"
        />
      </div>

      <ng-template pTemplate="footer">
        <div class="modal-actions">
          <p-button
            [text]="true"
            [label]="tokens.COMMON.CANCEL | translate"
            (onClick)="onCancel()"
            severity="secondary"
            type="button"
          />
          <p-button
            [label]="confirmButtonText()"
            [severity]="confirmButtonSeverity()"
            [disabled]="confirmationInput !== confirmationPhrase()"
            (onClick)="onConfirm()"
            type="button"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './confirm-action-modal.css',
})
export class ConfirmActionModal {
  protected readonly tokens = TRANSLATION_TOKENS;
  readonly title = input.required<string>();
  readonly warningMessage = input.required<string>();
  readonly confirmationPhrase = input.required<string>();
  readonly confirmButtonText = input('I understand, confirm');
  readonly variant = input<'danger' | 'info' | 'success'>('danger');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected confirmationInput = '';

  protected readonly headerIconClass = computed(() => {
    switch (this.variant()) {
      case 'info':
        return 'fa-solid fa-circle-info modal-warning-icon info';
      case 'success':
        return 'fa-solid fa-circle-check modal-warning-icon success';
      case 'danger':
      default:
        return 'fa-solid fa-triangle-exclamation modal-warning-icon danger';
    }
  });

  protected readonly bodyIconClass = computed(() => {
    switch (this.variant()) {
      case 'info':
        return 'fa-solid fa-circle-info';
      case 'success':
        return 'fa-solid fa-circle-check';
      case 'danger':
      default:
        return 'fa-solid fa-circle-exclamation';
    }
  });

  protected readonly confirmButtonSeverity = computed(() => {
    switch (this.variant()) {
      case 'danger':
        return 'danger';
      case 'info':
        return 'info';
      case 'success':
      default:
        return 'success';
    }
  });

  protected onConfirm(): void {
    this.confirmationInput = '';
    this.confirmed.emit();
  }

  protected onCancel(): void {
    this.confirmationInput = '';
    this.cancelled.emit();
  }
}
