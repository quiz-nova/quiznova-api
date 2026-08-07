import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-no-pending-grades',
  imports: [],
  template: `
    <div class="empty-state" role="status">
      <div class="empty-icon">
        <i class="fa-solid fa-clipboard-check"></i>
      </div>
      <h2>All caught up!</h2>
      <p>There are no essay answers waiting for your review.</p>
    </div>
  `,
  styleUrl: './no-pending-grades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoPendingGrades {}
