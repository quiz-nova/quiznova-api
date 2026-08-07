import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ROLE_DEFINITIONS } from '@Core/config/role.config';
import { AuthService } from '@Features/auth/auth.service';

import { User } from '@shared/models/users/user.model';

@Component({
  selector: 'qn-tab',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      class="tab"
      [routerLink]="routeLink()"
      [routerLinkActiveOptions]="{ exact: true }"
      routerLinkActive="active"
      ariaCurrentWhenActive="page"
    >
      <i class="tab-icon" [class]="iconClass()" aria-hidden="true"></i>
      <span class="tab-label">{{ tabName() }}</span>
    </a>
  `,
  styles: [
    `
      .tab {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        min-height: 3.5rem;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        color: var(--clr-gray-600);
        font-size: var(--fs-400);
        font-weight: 600;
        transition:
          background-color 0.25s var(--ease-standard),
          color 0.25s var(--ease-standard),
          transform 0.25s var(--ease-standard);
      }

      .tab:hover {
        background-color: var(--clr-green-50);
        color: var(--clr-green-600);
        transform: translateX(4px);
      }

      .tab.active {
        background-color: var(--clr-green-100);
        color: var(--clr-green-800);
        font-weight: 700;
      }

      .tab-icon {
        width: 1.25rem;
        text-align: center;
        font-size: 1.1rem;
        transition: transform 0.25s var(--ease-standard);
      }

      .tab:hover .tab-icon {
        transform: scale(1.1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab {
  readonly tabName = input.required<string>();
  private readonly authService = inject(AuthService);
  private readonly iconMap: Record<string, string> = {
    Dashboard: 'fa-solid fa-gauge',
    'My Courses': 'fa-solid fa-book-open',
    'Create Quiz': 'fa-solid fa-pen-to-square',
    'Question Bank': 'fa-solid fa-database',
    'Assign Quiz': 'fa-solid fa-clipboard-list',
    'View Results': 'fa-solid fa-eye',
    Quizzes: 'fa-solid fa-file-lines',
    'Quiz Attempts': 'fa-solid fa-list-check',
    Results: 'fa-solid fa-square-poll-vertical',
    Instructors: 'fa-solid fa-chalkboard-user',
    Students: 'fa-solid fa-users',
    Courses: 'fa-solid fa-book',
    Admins: 'fa-solid fa-user-shield',
    Settings: 'fa-solid fa-gear',
    'Pending Grades': 'fa-solid fa-clipboard-check',
    'Course Chat': 'fa-solid fa-comments',
  };

  protected readonly routeLink = computed(() => {
    const user: User | null = this.authService.currentUser();
    if (!user) return null;

    const roleConfig = ROLE_DEFINITIONS[user.role];
    return roleConfig.actionRouteLinks?.[this.tabName()] ?? null;
  });

  protected readonly iconClass = computed(
    () => this.iconMap[this.tabName()] ?? 'fa-solid fa-circle',
  );
}
