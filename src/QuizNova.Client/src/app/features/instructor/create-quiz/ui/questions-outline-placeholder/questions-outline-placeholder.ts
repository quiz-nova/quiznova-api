import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-questions-outline-placeholder',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-outline-placeholder">
      <p class="placeholder-text">Your quiz outline will appear here as you add questions.</p>
    </div>
  `,
  styleUrl: './questions-outline-placeholder.css',
})
export class QuestionsOutlinePlaceholder {}
