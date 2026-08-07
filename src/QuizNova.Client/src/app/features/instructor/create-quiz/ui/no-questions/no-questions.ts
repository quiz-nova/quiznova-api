import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-no-questions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="no-questions">
      <div class="icon">
        <i class="fa-solid fa-clipboard" aria-hidden="true"></i>
      </div>
      <h6 class="no-questions-title">No questions yet</h6>
      <p class="no-questions-sub-title">
        Select a question type above and click "Add Question" to start building your quiz.
      </p>
    </div>
  `,
  styleUrl: './no-questions.css',
})
export class NoQuestions {}
