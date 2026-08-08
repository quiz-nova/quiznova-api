import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'qn-role-dashboard-header',
  imports: [],
  template: `
    <div>
      <h1>{{ title() }}</h1>
      <p class="description">{{ description() }}</p>
    </div>
  `,
  styleUrls: ['./role-dashboard-header.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDashboardHeader {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
