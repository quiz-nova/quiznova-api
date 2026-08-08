import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { AuthService } from '@Features/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressSpinner } from 'primeng/progressspinner';
import { of } from 'rxjs';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { CoursesService } from '@shared/services/courses.service';
import { shortId } from '@shared/utils/utilities';

@Component({
  selector: 'qn-instructor-courses',
  imports: [ProgressSpinner, RoleDashboardHeader, OperationFailed, TranslatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          [title]="tokens.INSTRUCTOR.COURSES_TITLE | translate"
          [description]="tokens.INSTRUCTOR.COURSES_DESC | translate"
        />
      </header>

      @if (coursesResource.isLoading()) {
        <div class="status-container">
          <p-progress-spinner [ariaLabel]="tokens.COMMON.LOADING | translate" />
        </div>
      } @else if (coursesResource.error()) {
        <qn-operation-failed>
          <p>{{ tokens.INSTRUCTOR.FAILED_LOAD_COURSES | translate }}</p>
        </qn-operation-failed>
      } @else if (!(coursesResource.value()?.length ?? 0)) {
        <p class="feedback">{{ tokens.INSTRUCTOR.NO_COURSES_ASSIGNED | translate }}</p>
      } @else {
        <section
          class="course-grid"
          [attr.aria-label]="tokens.INSTRUCTOR.COURSES_TITLE | translate"
        >
          @for (course of coursesResource.value() ?? []; track course.id) {
            <article class="course-card">
              <div class="course-card__header">
                <div>
                  <p class="course-label">{{ tokens.INSTRUCTOR.COURSE_LABEL | translate }}</p>
                  <h2>{{ course.courseName }}</h2>
                </div>
                <div class="course-icon" aria-hidden="true">
                  <i class="fa-solid fa-book-open-reader"></i>
                </div>
              </div>

              <p class="course-id">ID {{ shortId(course.id) }}</p>

              <dl class="course-stats">
                <div>
                  <dt>{{ tokens.NAV.STUDENTS | translate }}</dt>
                  <dd>{{ course.enrolledStudentsCount }}</dd>
                </div>
                <div>
                  <dt>{{ tokens.NAV.QUIZZES | translate }}</dt>
                  <dd>{{ course.quizzesCount }}</dd>
                </div>
              </dl>
            </article>
          }
        </section>
      }
    </section>
  `,
  styleUrl: './instructor-courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorCourses {
  private readonly authService = inject(AuthService);
  private readonly coursesService = inject(CoursesService);
  protected readonly shortId = shortId;
  protected readonly tokens = TRANSLATION_TOKENS;

  protected readonly instructorId = computed(() => this.authService.currentUser()?.id ?? null);

  protected readonly coursesResource = rxResource({
    stream: () => {
      const instructorId = this.instructorId();

      if (!instructorId) {
        return of(undefined);
      }

      return this.coursesService.getInstructorCourses(instructorId);
    },
  });
}
