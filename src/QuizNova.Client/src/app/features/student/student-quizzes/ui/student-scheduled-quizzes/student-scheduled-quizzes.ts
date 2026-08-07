import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TableModule } from 'primeng/table';

import { durationInMinutes } from '@shared/utils/utilities';

import { StudentQuizApiDto } from '../../models/student-quizzes.model';

@Component({
  selector: 'qn-student-scheduled-quizzes',
  imports: [DatePipe, TableModule],
  template: `
    <section class="quiz-section" aria-labelledby="scheduled-heading">
      <h2 id="scheduled-heading">Scheduled</h2>
      @if (quizzes().length === 0) {
        <p class="empty-state">No scheduled quizzes.</p>
      } @else {
        <div class="table-shell">
          <p-table [value]="quizzes()" [tableStyle]="{ 'min-width': '46rem' }">
            <ng-template #header>
              <tr>
                <th>Quiz</th>
                <th>Course</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Starts On</th>
                <th>Status</th>
              </tr>
            </ng-template>
            <ng-template #body let-quiz>
              <tr>
                <td>{{ quiz.title }}</td>
                <td>{{ quiz.courseName }}</td>
                <td>{{ quiz.questionsCount }}</td>
                <td>{{ durationInMinutes(quiz.startsAtUtc, quiz.endsAtUtc) }} min</td>
                <td>
                  <time [attr.datetime]="quiz.startsAtUtc">{{
                    quiz.startsAtUtc | date: 'short'
                  }}</time>
                </td>
                <td><span class="locked-tag">Locked</span></td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </section>
  `,
  styleUrl: './student-scheduled-quizzes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentScheduledQuizzes {
  readonly quizzes = input.required<StudentQuizApiDto[]>();
  readonly serverUtc = input.required<string>();
  protected readonly durationInMinutes = durationInMinutes;
}
