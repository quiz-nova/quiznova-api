import { ChangeDetectionStrategy, Component } from '@angular/core';

export interface FeatureCardData {
  id: number;
  icon: string;
  title: string;
  content: string;
}

export const featureCards: FeatureCardData[] = [
  {
    id: 1,
    icon: 'fa-solid fa-gauge-high',
    title: 'Role-Based Dashboards',
    content:
      'Dedicated dashboards for Admins, Instructors, and Students with real-time charts — doughnut, bar, and line visualizations — plus key metric cards for at-a-glance insights.',
  },
  {
    id: 2,
    icon: 'fa-solid fa-pen-to-square',
    title: 'Smart Quiz Builder',
    content:
      'Create quizzes with Multiple Choice, True/False, and Essay questions. Set time limits, configure marks, and preview before publishing — all in an intuitive step-by-step wizard.',
  },
  {
    id: 3,
    icon: 'fa-solid fa-clock',
    title: 'Real-Time Quiz Engine',
    content:
      'Students take quizzes with a live countdown timer, randomized questions, and progress navigation. Auto-graded questions return instant results with detailed answer review.',
  },
  {
    id: 4,
    icon: 'fa-solid fa-building-columns',
    title: 'Institution Management',
    content:
      'Full CRUD for colleges, courses, instructors, students, and admins. Paginated tables with search, filters, and role assignment — everything needed to manage your institution.',
  },
  {
    id: 5,
    icon: 'fa-solid fa-clipboard-check',
    title: 'Grade Review Workflow',
    content:
      'Pending grade queues for instructors with rubric-based essay scoring. Students see detailed result breakdowns, score trends over time, and per-question feedback.',
  },
  {
    id: 6,
    icon: 'fa-solid fa-comments',
    title: 'Course Chat',
    content:
      'Real-time messaging between instructors and students within each course. Emoji reactions, threaded replies, connection status indicators, and seamless SignalR integration.',
  },
];

@Component({
  selector: 'qn-feature-card',
  standalone: true,
  template: `
    <article class="card">
      <div class="icon">
        <ng-content select="i"></ng-content>
      </div>

      <ng-content select=".card-title"></ng-content>

      <ng-content select=".card-content"></ng-content>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .card {
      display: flex;
      justify-content: flex-start;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 250px;
      padding: 1.75rem;
      border: 1px solid var(--clr-gray-200);
      border-radius: var(--radius-lg);
      background-color: var(--clr-white);
      transition:
        transform 0.3s var(--ease-spring),
        border-color 0.3s var(--ease-spring);

      @media (width < 768px) {
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }

      h3 {
        font-family: var(--ff-heading), sans-serif;
        font-size: var(--fs-500);
        font-weight: 700;
        color: var(--clr-blue-900);
        margin: 0;
      }

      p {
        color: var(--clr-gray-600);
        font-size: var(--fs-400);
        line-height: 1.5;
        margin: 0;
      }

      &:hover {
        transform: translateY(-4px) scale(1.02);
        border-color: var(--clr-green-300);

        .icon {
          transform: scale(1.15) rotate(5deg);
          color: var(--clr-white);
        }
      }
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      background: var(--clr-green-100);
      color: var(--clr-green-400);
      font-size: 1.15rem;
      transition:
        transform 0.3s var(--ease-spring),
        background-color 0.3s var(--ease-spring),
        color 0.3s var(--ease-spring);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCard {}
