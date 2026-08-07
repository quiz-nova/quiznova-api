import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface GradingStat {
  label: string;
  value: number;
  icon: string;
  iconClass: string;
}

@Component({
  selector: 'qn-pending-grades-stats',
  imports: [],
  template: `
    <section class="stats-row" aria-label="Grading summary">
      @for (stat of stats(); track stat.label) {
        <article class="stat-card">
          <div class="stat-icon" [class]="stat.iconClass" aria-hidden="true">
            <i [class]="stat.icon"></i>
          </div>
          <div>
            <p class="stat-value">{{ stat.value }}</p>
            <p class="stat-label">{{ stat.label }}</p>
          </div>
        </article>
      }
    </section>
  `,
  styleUrl: './pending-grades-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingGradesStats {
  readonly stats = input.required<GradingStat[]>();
}
