import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-no-answer',
  imports: [],
  template: `
    <div class="no-answer" role="status">
      <i class="fa-solid fa-ban" aria-hidden="true"></i>
      Student did not answer this question
    </div>
  `,
  styleUrl: './no-answer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoAnswer {}
