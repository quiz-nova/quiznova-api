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
  styles: [
    `
      :host {
        display: block;
      }

      .dashboard-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1.5rem;
        min-height: 9.5rem;
        padding: 1.75rem;
        background: var(--clr-white);
        border: 1px solid var(--clr-gray-200);
        border-radius: var(--radius-lg, var(--radius-lg));
        box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
        transition:
          transform 0.3s var(--ease-spring),
          border-color 0.3s var(--ease-spring),
          box-shadow 0.3s var(--ease-spring);
      }

      .dashboard-card:hover {
        transform: translateY(-4px);
        border-color: var(--theme-border);
        box-shadow:
          0 12px 24px -4px rgba(15, 23, 42, 0.06),
          0 8px 12px -6px rgba(15, 23, 42, 0.04);
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .card-title {
        margin: 0;
        color: var(--clr-gray-600);
        font-family: var(--ff-heading), sans-serif;
        font-size: 1.125rem;
        font-weight: 700;
        line-height: 1.3;
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .card-value {
        margin: 0;
        color: var(--clr-blue-900);
        font-size: clamp(2rem, 4vw, 2.5rem);
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.02em;
      }

      .card-caption {
        margin: 0;
        color: var(--clr-gray-500);
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .card-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        border-radius: var(--radius-md, var(--radius-md));
        font-size: 1.35rem;
        transition:
          transform 0.3s var(--ease-spring),
          background-color 0.3s var(--ease-spring),
          color 0.3s var(--ease-spring);
      }

      .dashboard-card:hover .card-icon {
        transform: scale(1.1) rotate(4deg);
      }

      .theme-green {
        --theme-bg: var(--clr-green-50);
        --theme-text: var(--clr-green-600);
        --theme-border: var(--clr-green-300);
      }
      .theme-amber {
        --theme-bg: var(--clr-amber-50);
        --theme-text: var(--clr-amber-700);
        --theme-border: var(--clr-amber-200);
      }
      .theme-violet {
        --theme-bg: var(--clr-violet-50);
        --theme-text: var(--clr-violet-700);
        --theme-border: var(--clr-violet-200);
      }
      .theme-cyan {
        --theme-bg: var(--clr-cyan-50);
        --theme-text: var(--clr-cyan-700);
        --theme-border: var(--clr-cyan-200);
      }
      .theme-primary {
        --theme-bg: var(--clr-green-50);
        --theme-text: var(--clr-green-400);
        --theme-border: var(--clr-green-400);
      }
      .theme-red {
        --theme-bg: var(--clr-red-50);
        --theme-text: var(--clr-red-600);
        --theme-border: var(--clr-red-200);
      }
      .theme-gray {
        --theme-bg: var(--clr-gray-100);
        --theme-text: var(--clr-gray-600);
        --theme-border: var(--clr-gray-300);
      }

      .card-icon {
        background-color: var(--theme-bg);
        color: var(--theme-text);
      }
    `,
  ],
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
