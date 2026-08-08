import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UIChart } from 'primeng/chart';

import { ChartPlaceholder } from '@shared/components/chart-placeholder/chart-placeholder';
import { CoursePerformance } from '@shared/models/course/course-performance.model';
import { Course } from '@shared/models/course/course.model';
import { chartColor } from '@shared/utils/chart-colors';

@Component({
  selector: 'qn-instructor-dashboard-charts',
  imports: [UIChart, ChartPlaceholder, TranslatePipe],
  template: `
    <section class="charts-grid" aria-label="Course analytics">
      <article class="chart-card">
        <h3 class="chart-title">{{ tokens.INSTRUCTOR.STUDENTS_ENROLLED_CHART | translate }}</h3>
        <div class="chart-container">
          @defer (on viewport({rootMargin: '100px'}); prefetch on viewport({rootMargin: '200px'})) {
            <p-chart
              [data]="enrolledChartData()"
              [options]="enrolledChartOptions()"
              type="bar"
              height="300"
            />
          } @placeholder {
            <qn-chart-placeholder />
          }
        </div>
      </article>
      <article class="chart-card">
        <h3 class="chart-title">{{ tokens.INSTRUCTOR.AVG_SCORE_CHART | translate }}</h3>
        <div class="chart-container">
          @defer (on viewport({rootMargin: '100px'}); prefetch on viewport({rootMargin: '200px'})) {
            <p-chart
              [data]="performanceChartData()"
              [options]="performanceChartOptions()"
              type="bar"
              height="300"
            />
          } @placeholder {
            <qn-chart-placeholder />
          }
        </div>
      </article>
    </section>
  `,
  styleUrl: './instructor-dashboard-charts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboardCharts {
  private readonly translate = inject(TranslateService);

  protected readonly tokens = TRANSLATION_TOKENS;

  readonly coursesList = input.required<Course[]>();
  readonly performanceList = input.required<CoursePerformance[]>();

  protected readonly enrolledChartData = computed(() => {
    const courses = this.coursesList();
    const label = this.translate.instant(TRANSLATION_TOKENS.INSTRUCTOR.ENROLLED_STUDENTS_LABEL);
    return {
      labels: courses.map((c) => c.courseName),
      datasets: [
        {
          label,
          backgroundColor: chartColor('--clr-green-100'),
          borderColor: chartColor('--clr-green-400'),
          borderWidth: 1.5,
          hoverBackgroundColor: chartColor('--clr-green-200'),
          data: courses.map((c) => c.enrolledStudentsCount),
        },
      ],
    };
  });

  protected readonly enrolledChartOptions = computed(() => {
    return {
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
        },
      },
    };
  });

  protected readonly performanceChartData = computed(() => {
    const perf = this.performanceList();
    const label = this.translate.instant(TRANSLATION_TOKENS.INSTRUCTOR.AVG_SCORE_PERCENT_LABEL);
    const backgroundColors = perf.map((c) =>
      c.avgScore >= 80
        ? chartColor('--clr-green-100')
        : c.avgScore >= 50
          ? chartColor('--clr-gray-100')
          : chartColor('--clr-red-50'),
    );
    const borderColors = perf.map((c) =>
      c.avgScore >= 80
        ? chartColor('--clr-green-400')
        : c.avgScore >= 50
          ? chartColor('--clr-gray-600')
          : chartColor('--clr-red-500'),
    );
    const hoverBackgroundColors = perf.map((c) =>
      c.avgScore >= 80
        ? chartColor('--clr-green-200')
        : c.avgScore >= 50
          ? chartColor('--clr-gray-200')
          : chartColor('--clr-red-200'),
    );

    return {
      labels: perf.map((c) => c.name),
      datasets: [
        {
          label,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          hoverBackgroundColor: hoverBackgroundColors,
          data: perf.map((c) => c.avgScore),
        },
      ],
    };
  });

  protected readonly performanceChartOptions = computed(() => {
    return {
      indexAxis: 'y' as const,
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
            color: chartColor('--clr-gray-150'),
          },
          ticks: {
            color: chartColor('--clr-gray-650'),
            font: { family: 'Inter', size: 11 },
          },
          min: 0,
          max: 100,
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'var(--clr-gray-650)',
            font: { family: 'Inter', size: 11 },
          },
        },
      },
    };
  });
}
