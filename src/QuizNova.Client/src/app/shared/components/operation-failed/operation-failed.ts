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
  styleUrls: ['./operation-failed.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationFailed {}
