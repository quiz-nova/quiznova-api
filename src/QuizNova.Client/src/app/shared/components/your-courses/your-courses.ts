import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { ROLE_DEFINITIONS } from '@Core/config/role.config';
import { AuthService } from '@Features/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';

import { UserRole } from '@shared/models/users/user-role.model';
import { CoursesService } from '@shared/services/courses.service';
import { EnrollmentService } from '@shared/services/enrollment.service';

interface SidebarCourse {
  id: string;
  name: string;
}

@Component({
  selector: 'qn-your-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="sidebar-container">
      <h3 class="sidebar-title">{{ tokens.STUDENT.MY_COURSES | translate }}</h3>
      @if (loading()) {
        <div class="loading-state">
          <i class="fa-solid fa-spinner fa-spin"></i> {{ tokens.COMMON.LOADING | translate }}
        </div>
      } @else if (courses().length === 0) {
        <div class="empty-state">{{ tokens.STUDENT.NO_COURSES | translate }}</div>
      } @else {
        <ul class="course-list">
          @for (course of courses(); track course.id) {
            <li class="course-item">
              <a
                class="course-link"
                [routerLink]="[baseRoute(), course.id]"
                routerLinkActive="active"
              >
                <div class="course-avatar">
                  {{ course.name.charAt(0).toUpperCase() }}
                </div>
                <span class="course-name">{{ course.name }}</span>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './your-courses.css',
})
export class YourCourses implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly coursesService = inject(CoursesService);
  private readonly enrollmentService = inject(EnrollmentService);

  protected readonly tokens = TRANSLATION_TOKENS;

  readonly courses = signal<SidebarCourse[]>([]);
  readonly loading = signal<boolean>(true);

  protected readonly baseRoute = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '/';
    return ROLE_DEFINITIONS[user.role].actionRouteLinks?.['Course Chat'] ?? '/';
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }

    if (user.role === UserRole.student) {
      this.enrollmentService.getEnrollments(user.id).subscribe({
        next: (enrollments) => {
          this.courses.set(
            enrollments.map((e) => ({
              id: e.courseId,
              name: e.courseName,
            })),
          );
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
    } else if (user.role === UserRole.instructor) {
      this.coursesService.getInstructorCourses(user.id).subscribe({
        next: (res) => {
          this.courses.set(
            res.map((c) => ({
              id: c.id,
              name: c.courseName,
            })),
          );
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }
}
