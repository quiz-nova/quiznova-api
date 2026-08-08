import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { AuthService } from '@Features/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
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
    TranslatePipe,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          [description]="tokens.DASHBOARD.WELCOME_USER | translate: { name: welcomeName() }"
          [title]="tokens.DASHBOARD.ADMIN_TITLE | translate"
        />
      </header>

      @if (summaryResource.isLoading()) {
        <div class="spinner">
          <p-progress-spinner [ariaLabel]="tokens.COMMON.LOADING | translate" />
        </div>
      } @else if (summaryResource.error()) {
        <qn-operation-failed>
          <p>{{ tokens.COMMON.NO_DATA | translate }}</p>
        </qn-operation-failed>
      } @else {
        <section class="card-grid">
          @for (card of cards(); track card.title) {
            <qn-role-dashboard-card
              [title]="card.title | translate"
              [value]="card.value"
              [icon]="card.icon"
              [caption]="card.caption | translate"
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

  protected readonly tokens = TRANSLATION_TOKENS;

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
        title: TRANSLATION_TOKENS.NAV.STUDENTS,
        value: summary?.totalStudents ?? 0,
        caption: TRANSLATION_TOKENS.ADMIN.STUDENTS_CAPTION,
        icon: 'fa-solid fa-users',
        theme: 'cyan' as const,
      },
      {
        title: TRANSLATION_TOKENS.NAV.INSTRUCTORS,
        value: summary?.totalInstructors ?? 0,
        caption: TRANSLATION_TOKENS.ADMIN.INSTRUCTORS_CAPTION,
        icon: 'fa-solid fa-chalkboard-user',
        theme: 'violet' as const,
      },
      {
        title: TRANSLATION_TOKENS.NAV.COURSES,
        value: summary?.totalCourses ?? 0,
        caption: TRANSLATION_TOKENS.ADMIN.COURSES_CAPTION,
        icon: 'fa-solid fa-book',
        theme: 'green' as const,
      },
    ];
  });
}
