import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { ProgressSpinner } from 'primeng/progressspinner';

import { NavigationButtons } from '@shared/components/navigation-buttons/navigation-buttons';
import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { PaginatedList } from '@shared/models/pagination/paginated-list.model';
import { PendingManualAnswers } from '@shared/models/quiz-attempt/pending-manual-answer.model';
import { QuizAttemptService } from '@shared/services/quiz-attempt.service';
import { initials } from '@shared/utils/utilities';

import { NoPendingGrades } from './ui/no-pending-grades/no-pending-grades';
import { PendingGradesStats } from './ui/pending-grades-stats/pending-grades-stats';

@Component({
  selector: 'qn-pending-grades',
  imports: [
    ProgressSpinner,
    RoleDashboardHeader,
    DatePipe,
    NoPendingGrades,
    PendingGradesStats,
    OperationFailed,
    NavigationButtons,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          title="Pending Grades"
          description="Essay submissions awaiting your review"
        />
      </header>

      @if (pendingResource.isLoading()) {
        <div class="status-container">
          <p-progress-spinner ariaLabel="Loading pending grades" />
        </div>
      } @else if (pendingResource.error()) {
        <qn-operation-failed>
          <p>Failed to load pending grades. Please try again.</p>
        </qn-operation-failed>
      } @else {
        <!-- Stats row -->
        <qn-pending-grades-stats [stats]="stats()" />

        <!-- Pending list -->
        @if (pendingList().length === 0) {
          <qn-no-pending-grades />
        } @else {
          <section class="list-container" aria-label="Pending grading submissions">
            <div class="list-header">
              <span>Student</span>
              <span>Quiz / Course</span>
              <span>Submitted</span>
              <span>Pending</span>
              <span></span>
            </div>

            @for (item of pendingList(); track item.attemptId) {
              <article
                class="submission-row"
                [attr.aria-label]="'Review submission by ' + item.studentName"
                (click)="navigateToReview(item)"
                (keydown.enter)="navigateToReview(item)"
                tabindex="0"
                role="button"
              >
                <!-- Avatar + Student Name -->
                <div class="student-cell">
                  <div class="avatar" aria-hidden="true">
                    {{ initials(item.studentName) }}
                  </div>
                  <div>
                    <p class="student-name">{{ item.studentName }}</p>
                  </div>
                </div>

                <!-- Quiz / Course -->
                <div class="quiz-cell">
                  <p class="quiz-title">{{ item.quizTitle }}</p>
                  <p class="course-name">
                    <i class="fa-solid fa-book-open"></i>
                    {{ item.courseName }}
                  </p>
                </div>

                <!-- Submitted At -->
                <div class="date-cell">
                  <time [attr.datetime]="item.submittedAt">{{
                    item.submittedAt | date: 'short'
                  }}</time>
                </div>

                <!-- Badge -->
                <div class="badge-cell">
                  <span class="pending-badge">
                    {{ item.ungradedCount }}
                    {{ item.ungradedCount === 1 ? 'question' : 'questions' }}
                  </span>
                </div>

                <!-- Arrow -->
                <div class="arrow-cell" aria-hidden="true">
                  <i class="fa-solid fa-chevron-right"></i>
                </div>
              </article>
            }

            <!-- Pagination Row -->
            <div class="pagination-row">
              <p class="page-info">
                Page {{ pendingResource.value()?.pageNumber ?? 1 }} of
                {{ pendingResource.value()?.totalPages ?? 1 }}
              </p>
              <qn-navigation-buttons
                [canGoPrevious]="pendingResource.value()?.hasPreviousPage ?? false"
                [canGoNext]="pendingResource.value()?.hasNextPage ?? false"
                (previousButtonClicked)="goToPreviousPage()"
                (nextButtonClicked)="goToNextPage()"
                ariaLabel="Pending grades pagination"
                previousLabel="Previous page"
                nextLabel="Next page"
              />
            </div>
          </section>
        }
      }
    </section>
  `,
  styleUrl: './pending-grades.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingGrades {
  private readonly quizAttemptService = inject(QuizAttemptService);
  private readonly router = inject(Router);

  protected readonly pageNumber = signal(1);

  protected readonly pendingResource = rxResource<
    PaginatedList<PendingManualAnswers>,
    { page: number }
  >({
    params: () => ({ page: this.pageNumber() }),
    stream: ({ params }) => this.quizAttemptService.getPendingManualAnswers(params.page, 10),
  });

  protected readonly pendingList = computed<PendingManualAnswers[]>(
    () => this.pendingResource.value()?.items ?? [],
  );

  protected readonly stats = computed(() => {
    const response = this.pendingResource.value();
    const totalCount = response?.totalCount ?? 0;
    const items = response?.items ?? [];
    const totalUngraded = items.reduce(
      (sum: number, item: PendingManualAnswers) => sum + item.ungradedCount,
      0,
    );

    return [
      {
        label: 'Awaiting Review',
        value: totalCount,
        icon: 'fa-solid fa-hourglass-half',
        iconClass: 'stat-icon amber',
      },
      {
        label: 'Total Questions (Page)',
        value: totalUngraded,
        icon: 'fa-solid fa-pen-nib',
        iconClass: 'stat-icon violet',
      },
    ];
  });

  protected goToPreviousPage(): void {
    this.pageNumber.update((value) => Math.max(1, value - 1));
  }

  protected goToNextPage(): void {
    this.pageNumber.update((value) => value + 1);
  }

  protected navigateToReview(item: PendingManualAnswers): void {
    this.router.navigate(['/instructor/grade', item.attemptId]);
  }

  protected readonly initials = initials;
}
