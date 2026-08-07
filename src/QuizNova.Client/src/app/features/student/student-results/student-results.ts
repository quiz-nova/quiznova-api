import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AuthService } from '@Features/auth/auth.service';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { of } from 'rxjs';

import { OperationFailed } from '@shared/components/operation-failed/operation-failed';
import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { QuizAttempt } from '@shared/models/quiz-attempt/quiz-attempt.model';
import { QuizAttemptService } from '@shared/services/quiz-attempt.service';

@Component({
  selector: 'qn-student-results',
  imports: [
    DatePipe,
    ProgressSpinner,
    RoleDashboardHeader,
    TableModule,
    Button,
    OperationFailed,
    RouterLink,
  ],
  template: `
    <section class="page">
      <qn-role-dashboard-header
        title="My Results"
        description="View and analyze your quiz attempts, scores, and feedback"
      />

      @if (resultsResource.isLoading()) {
        <div class="status-container">
          <p-progress-spinner ariaLabel="Loading results" />
        </div>
      } @else if (resultsResource.error()) {
        <qn-operation-failed>
          <p>Failed to load results.</p>
        </qn-operation-failed>
      } @else {
        @if (results().length === 0) {
          <div class="card empty-state">
            <p>No quiz attempts yet. Take a quiz to see your results here.</p>
          </div>
        } @else {
          <div class="card table-shell">
            <p-table [value]="results()" [tableStyle]="{ 'min-width': '50rem' }">
              <ng-template #header>
                <tr>
                  <th>Quiz</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </ng-template>
              <ng-template #body let-attempt>
                <tr>
                  <td class="cell-title">{{ attempt.quizTitle }}</td>
                  <td>
                    <span class="status-badge" [class.graded]="attempt.gradingState === 'Graded'">
                      {{ attempt.gradingState }}
                    </span>
                  </td>
                  <td>
                    <time [attr.datetime]="attempt.submittedAt">{{
                      attempt.submittedAt | date: 'short'
                    }}</time>
                  </td>
                  <td>
                    <p-button
                      [outlined]="true"
                      [routerLink]="['/student/review-quiz', attempt.quizAttemptId]"
                      label="Review"
                      severity="secondary"
                      type="button"
                    />
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }
      }
    </section>
  `,
  styleUrl: './student-results.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentResults {
  private readonly authService = inject(AuthService);
  private readonly quizAttemptService = inject(QuizAttemptService);

  protected readonly studentId = computed(() => this.authService.currentUser()?.id ?? null);

  protected readonly resultsResource = rxResource({
    stream: () => {
      const studentId = this.studentId();
      if (!studentId) {
        return of([] as QuizAttempt[]);
      }

      return this.quizAttemptService.getStudentQuizAttempts(studentId);
    },
    defaultValue: [] as QuizAttempt[],
  });

  protected readonly results = computed(() => this.resultsResource.value());
}
