import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { AuthService } from '@Features/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressSpinner } from 'primeng/progressspinner';
import { forkJoin, of } from 'rxjs';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardCard } from '@shared/components/role-dashboard-card/role-dashboard-card';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { QuizAttempt } from '@shared/models/quiz-attempt/quiz-attempt.model';
import { EnrollmentService } from '@shared/services/enrollment.service';
import { QuizAttemptService } from '@shared/services/quiz-attempt.service';

import { StudentDashboardCharts } from './ui/student-dashboard-charts/student-dashboard-charts';

@Component({
  selector: 'qn-student-dashboard',
  imports: [
    ProgressSpinner,
    RoleDashboardHeader,
    OperationFailed,
    RoleDashboardCard,
    StudentDashboardCharts,
    TranslatePipe,
  ],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <qn-role-dashboard-header
          [description]="tokens.DASHBOARD.WELCOME_USER | translate: { name: welcomeName() }"
          [title]="tokens.DASHBOARD.STUDENT_TITLE | translate"
        />
      </header>

      @if (summaryResource.isLoading()) {
        <div class="status-container">
          <p-progress-spinner [ariaLabel]="tokens.COMMON.LOADING | translate" />
        </div>
      } @else if (summaryResource.error()) {
        <qn-operation-failed>
          <p>{{ tokens.COMMON.NO_DATA | translate }}</p>
        </qn-operation-failed>
      } @else {
        <section class="card-grid" aria-label="Student summary">
          @for (card of cards(); track card.title) {
            <qn-role-dashboard-card
              [title]="card.title | translate"
              [value]="card.value"
              [icon]="card.icon"
              [theme]="card.theme"
            />
          }
        </section>

        <div class="charts-section">
          <qn-student-dashboard-charts [quizAttempts]="summaryResource.value().attempts" />
        </div>
      }
    </section>
  `,
  styleUrl: './student-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboard {
  private readonly authService = inject(AuthService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly quizAttemptsService = inject(QuizAttemptService);

  protected readonly tokens = TRANSLATION_TOKENS;

  protected readonly welcomeName = computed(
    () => this.authService.currentUser()?.personalInformation?.name || 'Student',
  );
  protected readonly studentId = computed(() => this.authService.currentUser()?.id ?? null);

  protected readonly summaryResource = rxResource({
    stream: () => {
      const studentId = this.studentId();

      if (!studentId) {
        return of({
          courses: { enrollmentsCount: 0 },
          quizAttempts: { quizAttemptCount: 0 },
          attempts: [] as QuizAttempt[],
        });
      }

      return forkJoin({
        courses: this.enrollmentService.getEnrollmentsCount(studentId),
        quizAttempts: this.quizAttemptsService.getStudentQuizAttemptsCount(studentId),
        attempts: this.quizAttemptsService.getStudentQuizAttempts(studentId),
      });
    },
    defaultValue: {
      courses: { enrollmentsCount: 0 },
      quizAttempts: { quizAttemptCount: 0 },
      attempts: [] as QuizAttempt[],
    },
  });

  protected readonly cards = computed(() => {
    const summary = this.summaryResource.value();

    return [
      {
        title: TRANSLATION_TOKENS.STUDENT.ENROLLED_COURSES,
        value: summary.courses.enrollmentsCount,
        icon: 'fa-solid fa-book-open',
        theme: 'green' as const,
      },
      {
        title: TRANSLATION_TOKENS.STUDENT.QUIZZES_TAKEN,
        value: summary.quizAttempts.quizAttemptCount,
        icon: 'fa-regular fa-clipboard',
        theme: 'cyan' as const,
      },
    ];
  });
}
