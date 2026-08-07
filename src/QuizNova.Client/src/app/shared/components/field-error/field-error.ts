import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'qn-field-error',
  imports: [],
  template: `
    <div class="field-error" [attr.id]="id()" aria-live="polite" role="status">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './field-error.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldError {
  readonly id = input.required<string>();
}
