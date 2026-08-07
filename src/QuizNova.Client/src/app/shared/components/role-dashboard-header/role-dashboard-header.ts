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
  styles: [
    `
      :host {
        display: block;
      }

      h1 {
        margin: 0;
        color: var(--clr-blue-900);
        font-family: var(--ff-heading), sans-serif;
        font-size: clamp(2rem, 4vw, var(--fs-700));
        font-weight: 700;
        line-height: 1.05;
      }

      .description {
        margin: 0.25rem 0 0;
        color: var(--clr-gray-600);
        font-size: clamp(1.05rem, 2vw, var(--fs-500));
        line-height: 1.3;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDashboardHeader {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
