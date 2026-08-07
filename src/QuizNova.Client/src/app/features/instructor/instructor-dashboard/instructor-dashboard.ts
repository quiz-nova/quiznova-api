import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AuthService } from '@Features/auth/auth.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { of, forkJoin } from 'rxjs';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardCard } from '@shared/components/role-dashboard-card/role-dashboard-card';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { CoursePerformance } from '@shared/models/course/course-performance.model';
import { Course } from '@shared/models/course/course.model';
import { CoursesService } from '@shared/services/courses.service';
import { QuizService } from '@shared/services/quiz.service';

import { InstructorDashboardCharts } from './ui/instructor-dashboard-charts/instructor-dashboard-charts';

@Component({
  selector: 'qn-instructor-dashboard',
  imports: [
    ProgressSpinner,
    RoleDashboardHeader,
    OperationFailed,
    RoleDashboardCard,
    InstructorDashboardCharts,
  ],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <qn-role-dashboard-header
          [description]="'Welcome back, ' + welcomeName()"
          title="Instructor Dashboard"
        />
      </header>

      @if (summaryResource.isLoading()) {
        <div class="status-container">
          <p-progress-spinner ariaLabel="Loading instructor dashboard" />
        </div>
      } @else if (summaryResource.error()) {
        <qn-operation-failed>
          <p>Failed to load dashboard data.</p>
        </qn-operation-failed>
      } @else {
        <section class="card-grid" aria-label="Instructor summary">
          @for (card of cards(); track card.title) {
            <qn-role-dashboard-card
              [title]="card.title"
              [value]="card.value"
              [icon]="card.icon"
              [theme]="card.theme"
            />
          }
        </section>

        <div class="charts-section">
          <qn-instructor-dashboard-charts
            [coursesList]="summaryResource.value().coursesList"
            [performanceList]="summaryResource.value().performanceList"
          />
        </div>
      }
    </section>
  `,
  styleUrl: './instructor-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboard {
  private readonly authService = inject(AuthService);
  private readonly coursesService = inject(CoursesService);
  private readonly quizService = inject(QuizService);

  protected readonly welcomeName = computed(
    () => this.authService.currentUser()?.personalInformation?.name || 'Instructor',
  );
  protected readonly instructorId = computed(() => this.authService.currentUser()?.id ?? null);

  protected readonly summaryResource = rxResource({
    stream: () => {
      const instructorId = this.instructorId();

      if (!instructorId) {
        return of({
          courses: { coursesCount: 0 },
          quizzes: { quizzesCount: 0 },
          coursesList: [] as Course[],
          performanceList: [] as CoursePerformance[],
        });
      }

      return forkJoin({
        courses: this.coursesService.getInstructorCoursesCount(instructorId),
        quizzes: this.quizService.getInstructorQuizzesCount(instructorId),
        coursesList: this.coursesService.getInstructorCourses(instructorId),
        performanceList: this.coursesService.getInstructorCoursesPerformance(instructorId),
      });
    },
    defaultValue: {
      courses: { coursesCount: 0 },
      quizzes: { quizzesCount: 0 },
      coursesList: [] as Course[],
      performanceList: [] as CoursePerformance[],
    },
  });

  protected readonly cards = computed(() => {
    const summary = this.summaryResource.value();

    return [
      {
        title: 'My Courses',
        value: summary.courses.coursesCount,
        icon: 'fa-solid fa-book-open',
        theme: 'green' as const,
      },
      {
        title: 'Total Quizzes',
        value: summary.quizzes.quizzesCount,
        icon: 'fa-regular fa-clipboard',
        theme: 'gray' as const,
      },
    ];
  });
}
