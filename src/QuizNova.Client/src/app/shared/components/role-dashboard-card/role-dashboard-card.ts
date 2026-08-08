import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'qn-role-dashboard-card',
  imports: [],
  template: `
    <article class="dashboard-card" [class]="'theme-' + theme()">
      <div class="card-header">
        <h2 class="card-title">{{ title() }}</h2>
        <div class="card-icon" aria-hidden="true">
          <i [class]="icon()"></i>
        </div>
      </div>

      <div class="card-content">
        <p class="card-value">{{ value() }}</p>
        @if (caption()) {
          <p class="card-caption">{{ caption() }}</p>
        }
      </div>
    </article>
  `,
  styleUrls: ['./role-dashboard-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDashboardCard {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input.required<string>();
  readonly caption = input<string>();
  readonly theme = input<'green' | 'amber' | 'violet' | 'cyan' | 'primary' | 'red' | 'gray'>(
    'green',
  );
}
