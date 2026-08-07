import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AuthService } from '@Features/auth/auth.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { of } from 'rxjs';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { EnrollmentService } from '@shared/services/enrollment.service';

@Component({
  selector: 'qn-student-courses',
  imports: [ProgressSpinner, DatePipe, RoleDashboardHeader, OperationFailed],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          title="My Enrolled Courses"
          description="View and access the courses you are currently enrolled in"
        />
      </header>

      @if (coursesResource.isLoading()) {
        <div class="spinner">
          <p-progress-spinner ariaLabel="Loading courses" />
        </div>
      } @else if (coursesResource.error()) {
        <qn-operation-failed>
          <p>Failed to load your courses. Please try again later.</p>
        </qn-operation-failed>
      } @else if (!(coursesResource.value()?.length ?? 0)) {
        <p class="feedback">You are not enrolled in any courses yet.</p>
      } @else {
        <section class="course-grid" aria-label="Enrolled courses">
          @for (course of coursesResource.value() ?? []; track course.courseId) {
            <article class="course-card">
              <div class="course-card__header">
                <div>
                  <h2>{{ course.courseName }}</h2>
                </div>
                <div class="course-icon" aria-hidden="true">
                  <i class="fa-solid fa-graduation-cap"></i>
                </div>
              </div>

              <p class="course-id">
                Enrolled on:
                <time [attr.datetime]="course.enrolledOnUtc">{{
                  course.enrolledOnUtc | date: 'mediumDate'
                }}</time>
              </p>

              <dl class="course-stats">
                <div>
                  <dt>Instructor</dt>
                  <dd>{{ course.instructor.name }}</dd>
                </div>
                <div>
                  <dt>Quizzes Taken</dt>
                  <dd>{{ course.student.quizzesTaken }}</dd>
                </div>
              </dl>
            </article>
          }
        </section>
      }
    </section>
  `,
  styleUrl: './enrollments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Enrollments {
  private readonly authService = inject(AuthService);
  private readonly enrollmentService = inject(EnrollmentService);

  protected readonly studentId = computed(() => this.authService.currentUser()?.id ?? null);

  protected readonly coursesResource = rxResource({
    stream: () => {
      const studentId = this.studentId();

      if (!studentId) {
        return of(undefined);
      }

      return this.enrollmentService.getEnrollments(studentId);
    },
  });
}
