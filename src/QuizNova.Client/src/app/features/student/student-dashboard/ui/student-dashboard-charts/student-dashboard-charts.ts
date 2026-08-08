import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UIChart } from 'primeng/chart';

import { ChartPlaceholder } from '@shared/components/chart-placeholder/chart-placeholder';
import { QuizAttempt } from '@shared/models/quiz-attempt/quiz-attempt.model';
import { chartColor } from '@shared/utils/chart-colors';

@Component({
  selector: 'qn-student-dashboard-charts',
  imports: [UIChart, ChartPlaceholder, TranslatePipe],
  template: `
    <section class="charts-grid" aria-label="Student analytics">
      <article class="chart-card">
        <h3 class="chart-title">{{ tokens.STUDENT.SCORE_TREND_CHART | translate }}</h3>
        <div class="chart-container">
          @defer (on viewport({rootMargin: '100px'}); prefetch on viewport({rootMargin: '200px'})) {
            <p-chart
              [data]="scoreTrendData()"
              [options]="scoreTrendOptions()"
              type="line"
              height="300"
            />
          } @placeholder {
            <qn-chart-placeholder />
          }
        </div>
      </article>
    </section>
  `,
  styleUrl: './student-dashboard-charts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardCharts {
  private readonly translate = inject(TranslateService);

  protected readonly tokens = TRANSLATION_TOKENS;

  readonly quizAttempts = input<QuizAttempt[]>([]);

  protected readonly scoreTrendData = computed(() => {
    const attempts = this.quizAttempts()
      .filter((a) => a.submittedAt)
      .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime());

    const label = this.translate.instant(TRANSLATION_TOKENS.STUDENT.SCORE_LABEL);

    return {
      labels: attempts.map((a) => a.quizTitle),
      datasets: [
        {
          label,
          backgroundColor: chartColor('--clr-green-400'),
          borderColor: chartColor('--clr-green-400'),
          borderWidth: 2,
          pointBackgroundColor: chartColor('--clr-green-400'),
          pointBorderColor: chartColor('--clr-white'),
          pointBorderWidth: 1.5,
          pointRadius: 4,
          tension: 0.3,
          fill: false,
          data: attempts.map((a) => a.score),
        },
      ],
    };
  });

  protected readonly scoreTrendOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: chartColor('--clr-black-500'),
        titleFont: { family: 'Space Grotesk', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: chartColor('--clr-gray-650'),
          font: { family: 'Inter', size: 11 },
        },
      },
      y: {
        grid: {
          color: chartColor('--clr-gray-150'),
        },
        ticks: {
          color: chartColor('--clr-gray-650'),
          font: { family: 'Inter', size: 11 },
          stepSize: 1,
        },
        min: 0,
      },
    },
  }));
}
