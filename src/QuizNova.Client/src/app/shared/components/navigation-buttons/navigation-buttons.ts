import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Button } from 'primeng/button';

@Component({
  selector: 'qn-navigation-buttons',
  imports: [Button],
  template: `
    <nav class="nav-actions" [attr.aria-label]="ariaLabel()">
      <p-button
        [disabled]="!canGoPrevious()"
        [label]="previousLabel()"
        [outlined]="true"
        (onClick)="previousButtonClicked.emit()"
        severity="secondary"
        type="button"
      />
      <p-button
        [disabled]="!canGoNext()"
        [label]="nextLabel()"
        (onClick)="nextButtonClicked.emit()"
        severity="success"
        type="button"
      />
    </nav>
  `,
  styleUrl: './navigation-buttons.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationButtons {
  readonly canGoPrevious = input.required<boolean>();
  readonly canGoNext = input.required<boolean>();
  readonly previousLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly ariaLabel = input.required<string>();

  readonly previousButtonClicked = output<void>();
  readonly nextButtonClicked = output<void>();
}
