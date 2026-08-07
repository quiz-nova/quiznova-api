import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'qn-tab-group',
  imports: [],
  template: `
    <nav class="tab-group" aria-label="Main Navigation">
      <ng-content />
    </nav>
  `,
  styles: [
    `
      .tab-group {
        display: grid;
        gap: 0.375rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabGroup {}
