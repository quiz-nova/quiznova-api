import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AuthService } from '@Features/auth/auth.service';
import { ProgressSpinner } from 'primeng/progressspinner';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardCard } from '@shared/components/role-dashboard-card/role-dashboard-card';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { CourseEnrollmentCount } from '@shared/models/enrollment/course-enrollment-count.model';
import { CollegeService } from '@shared/services/college.service';
import { EnrollmentService } from '@shared/services/enrollment.service';

import { AdminDashboardCharts } from './ui/admin-dashboard-charts/admin-dashboard-charts';

@Component({
  selector: 'qn-admin-dashboard',
  imports: [
    ProgressSpinner,
    RoleDashboardHeader,
    RoleDashboardCard,
    AdminDashboardCharts,
    OperationFailed,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          [description]="'Welcome back, ' + welcomeName()"
          title="Admin Dashboard"
        />
      </header>

      @if (summaryResource.isLoading()) {
        <div class="spinner">
          <p-progress-spinner ariaLabel="loading" />
        </div>
      } @else if (summaryResource.error()) {
        <qn-operation-failed>
          <p>Failed to load dashboard data.</p>
        </qn-operation-failed>
      } @else {
        <section class="card-grid">
          @for (card of cards(); track card.title) {
            <qn-role-dashboard-card
              [title]="card.title"
              [value]="card.value"
              [icon]="card.icon"
              [caption]="card.caption"
              [theme]="card.theme"
            />
          }
        </section>

        <div class="charts-section">
          <qn-admin-dashboard-charts
            [summary]="summaryResource.value() ?? null"
            [enrollmentCounts]="enrollmentResource.value()"
          />
        </div>
      }
    </section>
  `,
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly authService = inject(AuthService);
  private readonly collegeService = inject(CollegeService);
  private readonly enrollmentService = inject(EnrollmentService);

  protected readonly welcomeName = computed(
    () => this.authService.currentUser()?.personalInformation?.name || 'Admin',
  );

  protected readonly summaryResource = rxResource({
    stream: () => this.collegeService.getCollegeSummary(),
  });

  protected readonly enrollmentResource = rxResource({
    stream: () => this.enrollmentService.getAllCoursesEnrollmentCounts(),
    defaultValue: [] as CourseEnrollmentCount[],
  });

  protected readonly cards = computed(() => {
    const summary = this.summaryResource.value() ?? null;

    return [
      {
        title: 'Students',
        value: summary?.totalStudents ?? 0,
        caption: 'Registered learners in this college',
        icon: 'fa-solid fa-users',
        theme: 'cyan' as const,
      },
      {
        title: 'Instructors',
        value: summary?.totalInstructors ?? 0,
        caption: 'Teaching staff currently assigned',
        icon: 'fa-solid fa-chalkboard-user',
        theme: 'violet' as const,
      },
      {
        title: 'Courses',
        value: summary?.totalCourses ?? 0,
        caption: 'Courses tracked under this college',
        icon: 'fa-solid fa-book',
        theme: 'green' as const,
      },
    ];
  });
}
