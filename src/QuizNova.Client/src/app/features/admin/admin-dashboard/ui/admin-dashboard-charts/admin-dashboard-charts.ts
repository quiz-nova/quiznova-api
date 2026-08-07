import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CollegeSummary } from '@Features/admin/models/college-summary.model';
import { UIChart } from 'primeng/chart';

import { ChartPlaceholder } from '@shared/components/chart-placeholder/chart-placeholder';
import { CourseEnrollmentCount } from '@shared/models/enrollment/course-enrollment-count.model';
import { chartColor } from '@shared/utils/chart-colors';

@Component({
  selector: 'qn-admin-dashboard-charts',
  imports: [UIChart, ChartPlaceholder],
  template: `
    <section class="charts-grid" aria-label="College analytics">
      <article class="chart-card">
        <h3 class="chart-title">College Composition</h3>
        <div class="chart-container">
          @defer (on viewport({rootMargin: '100px'}); prefetch on viewport({rootMargin: '200px'})) {
            <p-chart
              [data]="compositionChartData()"
              [options]="compositionChartOptions()"
              type="doughnut"
              height="300"
            />
          } @placeholder {
            <qn-chart-placeholder />
          }
        </div>
      </article>
      <article class="chart-card">
        <h3 class="chart-title">Course Enrollments</h3>
        <div class="chart-container">
          @defer (on viewport({rootMargin: '100px'}); prefetch on viewport({rootMargin: '200px'})) {
            <p-chart
              [data]="enrollmentsChartData()"
              [options]="enrollmentsChartOptions()"
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
  styleUrl: './admin-dashboard-charts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardCharts {
  readonly summary = input.required<CollegeSummary | null>();
  readonly enrollmentCounts = input.required<CourseEnrollmentCount[]>();

  protected readonly compositionChartData = computed(() => {
    const s = this.summary();
    return {
      labels: ['Students', 'Instructors'],
      datasets: [
        {
          data: [s?.totalStudents ?? 0, s?.totalInstructors ?? 0],
          backgroundColor: [chartColor('--clr-green-400'), chartColor('--clr-gray-500')],
          hoverBackgroundColor: [chartColor('--clr-green-600'), chartColor('--clr-gray-600')],
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly compositionChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'Inter', size: 13 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: chartColor('--clr-black-500'),
        titleFont: { family: 'Space Grotesk', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context: { label: string; parsed: number }) =>
            ` ${context.label}: ${context.parsed}`,
        },
      },
    },
  }));

  protected readonly enrollmentsChartData = computed(() => {
    const counts = this.enrollmentCounts();
    return {
      labels: counts.map((c) => c.courseName),
      datasets: [
        {
          label: 'Enrolled Students',
          backgroundColor: chartColor('--clr-green-400'),
          hoverBackgroundColor: chartColor('--clr-green-600'),
          borderRadius: 6,
          data: counts.map((c) => c.enrollmentsCount),
        },
      ],
    };
  });

  protected readonly enrollmentsChartOptions = computed(() => ({
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
        beginAtZero: true,
      },
    },
  }));
}
