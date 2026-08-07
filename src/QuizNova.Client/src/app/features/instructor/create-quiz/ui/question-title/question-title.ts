import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { FieldError } from '@shared/components/field-error/field-error';

@Component({
  selector: 'qn-question-title',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <div class="question-title">
      <label for="questionText">Question Text</label>
      <textarea
        class="question-title__input"
        id="questionText"
        [formControl]="control()"
        [attr.aria-invalid]="control().invalid && control().touched ? 'true' : null"
        (blur)="titleBlur.emit(control().value)"
        placeholder="Enter question text..."
        aria-describedby="question-text-is-required-error question-text-minlength-error question-text-maxlength-error"
      ></textarea>

      @if (control().invalid && control().touched) {
        @if (control().hasError('required')) {
          <qn-field-error id="question-text-is-required-error"
            >Question text is required.</qn-field-error
          >
        }
        @if (control().hasError('minlength')) {
          <qn-field-error id="question-text-minlength-error"
            >Question text must be at least 3 characters.</qn-field-error
          >
        }
        @if (control().hasError('maxlength')) {
          <qn-field-error id="question-text-maxlength-error"
            >Question text cannot exceed 1000 characters.</qn-field-error
          >
        }
      }
    </div>
  `,
  styleUrl: './question-title.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionTitle {
  readonly control = input.required<FormControl<string>>();
  readonly titleBlur = output<string>();
}
