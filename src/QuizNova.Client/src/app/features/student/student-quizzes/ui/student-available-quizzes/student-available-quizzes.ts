import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { ConfirmActionModal } from '@shared/components/confirm-action-modal/confirm-action-modal';
import { QuizCountdownTag } from '@shared/components/quiz-countdown-tag/quiz-countdown-tag';
import { durationInMinutes } from '@shared/utils/utilities';

import { StudentQuizApiDto } from '../../models/student-quizzes.model';

@Component({
  selector: 'qn-student-available-quizzes',
  imports: [RouterLink, QuizCountdownTag, Button, ConfirmActionModal, TableModule],
  template: `
    <section class="quiz-section" aria-labelledby="available-heading">
      <h2 id="available-heading">Available Now</h2>
      @if (quizzes().length === 0) {
        <p class="empty-state">No available quizzes at the moment.</p>
      } @else {
        <div class="table-shell">
          <p-table [value]="quizzes()" [tableStyle]="{ 'min-width': '46rem' }">
            <ng-template #header>
              <tr>
                <th>Quiz</th>
                <th>Course</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Time Remaining</th>
                <th>Action</th>
              </tr>
            </ng-template>
            <ng-template #body let-quiz>
              <tr>
                <td>{{ quiz.title }}</td>
                <td>{{ quiz.courseName }}</td>
                <td>{{ quiz.questionsCount }}</td>
                <td>{{ durationInMinutes(quiz.startsAtUtc, quiz.endsAtUtc) }} min</td>
                <td>
                  <qn-quiz-countdown-tag
                    [endsAtUtc]="quiz.endsAtUtc"
                    [serverUtc]="serverUtc()"
                    (expired)="markQuizExpired(quiz.quizId)"
                  />
                </td>
                <td>
                  @if (quiz.attemptStatus === 'Completed') {
                    <span class="completed-badge">Completed</span>
                  } @else if (quiz.attemptId) {
                    <p-button
                      [routerLink]="['/student/quiz-attempt', quiz.quizId]"
                      [queryParams]="{ attemptId: quiz.attemptId }"
                      label="Continue"
                      severity="success"
                      type="button"
                    />
                  } @else {
                    <p-button
                      [disabled]="isQuizExpired(quiz.quizId)"
                      (onClick)="startQuiz(quiz)"
                      label="Start Quiz"
                      severity="success"
                      type="button"
                    />
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </section>

    @if (pendingQuiz(); as quiz) {
      <qn-confirm-action-modal
        [warningMessage]="'You are about to start the quiz: ' + quiz.title"
        (confirmed)="onConfirmStart()"
        (cancelled)="onCancelStart()"
        title="Start Quiz"
        confirmationPhrase="start"
        confirmButtonText="Yes, Start Quiz"
        variant="info"
      />
    }
  `,
  styleUrl: './student-available-quizzes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAvailableQuizzes {
  readonly quizzes = input.required<StudentQuizApiDto[]>();
  readonly serverUtc = input.required<string>();

  private readonly router = inject(Router);
  private readonly expiredQuizIds = signal<Record<string, true>>({});
  private readonly pendingQuizSignal = signal<StudentQuizApiDto | null>(null);

  protected readonly pendingQuiz = computed(() => this.pendingQuizSignal());

  protected markQuizExpired(quizId: string): void {
    this.expiredQuizIds.update((state) => ({
      ...state,
      [quizId]: true,
    }));
  }

  protected isQuizExpired(quizId: string): boolean {
    return this.expiredQuizIds()[quizId];
  }

  protected startQuiz(quiz: StudentQuizApiDto): void {
    this.pendingQuizSignal.set(quiz);
  }

  protected onConfirmStart(): void {
    const quiz = this.pendingQuizSignal();
    if (!quiz) return;

    this.pendingQuizSignal.set(null);
    this.router.navigate(['/student/quiz-attempt', quiz.quizId]);
  }

  protected onCancelStart(): void {
    this.pendingQuizSignal.set(null);
  }

  protected readonly durationInMinutes = durationInMinutes;
}
