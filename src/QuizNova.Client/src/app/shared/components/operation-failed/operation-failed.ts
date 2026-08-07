import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-operation-failed',
  imports: [],
  template: `
    <div class="status-container error-state" role="alert">
      <i class="fa-solid fa-circle-exclamation error-icon"></i>
      <ng-content />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .status-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        min-height: 12rem;
        padding: 2rem;
        text-align: center;
      }

      .error-state {
        border: 1px solid var(--clr-red-200);
        border-radius: var(--radius-md);
        color: var(--clr-red-700);
        background-color: var(--clr-red-50);
      }

      .error-icon {
        font-size: 2rem;
        color: var(--clr-red-500);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationFailed {}
