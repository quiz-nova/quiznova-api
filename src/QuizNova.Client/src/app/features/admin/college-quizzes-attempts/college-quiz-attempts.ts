import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal, rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { APP_SETTINGS } from '@Core/config/app.settings';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { TableModule, TablePageEvent } from 'primeng/table';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { QuizAttempt } from '@shared/models/quiz-attempt/quiz-attempt.model';
import { QuizAttemptService } from '@shared/services/quiz-attempt.service';
import { shortId } from '@shared/utils/utilities';

@Component({
  selector: 'qn-college-quizzes-attempts',
  imports: [
    TableModule,
    Skeleton,
    FormsModule,
    InputText,
    InputNumber,
    RoleDashboardHeader,
    DatePipe,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          title="Attempts Overview"
          description="Review student submissions, answers, and scores."
        />
      </header>

      <div class="filters-grid">
        <div class="filter-item">
          <label for="attempt-search">Search</label>
          <input
            class="focus-green-ring"
            id="attempt-search"
            [(ngModel)]="searchTerm"
            (ngModelChange)="pageNumber.set(1)"
            pInputText
            placeholder="Search by quiz title or student"
          />
        </div>

        <div class="filter-item">
          <label for="correct-answers">Correct answers</label>
          <p-inputnumber
            [(ngModel)]="correctAnswers"
            [min]="0"
            [showButtons]="true"
            (ngModelChange)="onCorrectAnswersChange($event)"
            inputId="correct-answers"
            placeholder="Any"
          ></p-inputnumber>
        </div>
      </div>

      <div class="table-shell">
        <p-table
          [value]="tableData()"
          [tableStyle]="{ 'min-width': '50rem' }"
          [paginator]="true"
          [rows]="pageSize()"
          [totalRecords]="quizAttemptsResource.value()?.totalCount ?? 0"
          [lazy]="true"
          [first]="(pageNumber() - 1) * pageSize()"
          [showFirstLastIcon]="false"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onPage)="onPageChange($event)"
        >
          <ng-template #header>
            <tr>
              <th>Attempt ID</th>
              <th>Quiz Title</th>
              <th>Answered</th>
              <th>Correct</th>
              <th>Score</th>
              <th>Submitted At</th>
            </tr>
          </ng-template>
          <ng-template #body let-attempt>
            <tr>
              @if (quizAttemptsResource.isLoading()) {
                <td><p-skeleton width="50%" height="1.5rem" /></td>
                <td><p-skeleton width="70%" height="1.5rem" /></td>
                <td><p-skeleton width="40%" height="1.5rem" /></td>
                <td><p-skeleton width="40%" height="1.5rem" /></td>
                <td><p-skeleton width="30%" height="1.5rem" /></td>
                <td><p-skeleton width="60%" height="1.5rem" /></td>
              } @else {
                <td>{{ shortId(attempt.quizAttemptId) }}</td>
                <td>{{ attempt.quizTitle }}</td>
                <td>{{ attempt.answeredQuestions }}/{{ attempt.totalQuestions }}</td>
                <td>{{ attempt.correctAnswers }}</td>
                <td>{{ attempt.score }}</td>
                <td>
                  <time [attr.datetime]="attempt.submittedAt">{{
                    attempt.submittedAt | date: 'short'
                  }}</time>
                </td>
              }
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6">
                @if (quizAttemptsResource.error()) {
                  <div class="error">
                    <p>Failed to load quiz attempts data.</p>
                  </div>
                } @else {
                  <p class="feedback">No quiz attempts match your filters.</p>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styleUrl: './college-quiz-attempts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollegeQuizzesAttempts {
  private readonly appSettings = inject(APP_SETTINGS);
  private readonly quizAttemptService = inject(QuizAttemptService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly shortId = shortId;

  protected readonly searchTerm = signal(this.route.snapshot.queryParams['search'] || '');
  protected readonly pageNumber = signal(Number(this.route.snapshot.queryParams['page']) || 1);
  protected readonly pageSize = signal(
    Number(this.route.snapshot.queryParams['size']) || this.appSettings.defaultPageSize,
  );
  protected readonly tableData = computed<QuizAttempt[]>(() => {
    if (this.quizAttemptsResource.isLoading()) {
      return Array.from<unknown, QuizAttempt>(
        { length: this.pageSize() },
        (_, i) =>
          ({
            quizAttemptId: `skeleton-${i}`,
          }) as unknown as QuizAttempt,
      );
    }
    if (this.quizAttemptsResource.error()) {
      return [];
    }
    return this.quizAttemptsResource.value()?.items ?? [];
  });
  protected readonly correctAnswers = signal<number | null>(
    this.route.snapshot.queryParams['correct']
      ? Number(this.route.snapshot.queryParams['correct'])
      : null,
  );

  constructor() {
    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchTerm() || null,
          page: this.pageNumber(),
          size: this.pageSize(),
          correct: this.correctAnswers(),
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  private readonly debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(
      map((value) => value?.trim() || ''),
      debounceTime(this.appSettings.debounceTimeMs),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly quizAttemptsResource = rxResource({
    params: () => ({
      searchTerm: this.debouncedSearchTerm(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      correctAnswers: this.correctAnswers(),
    }),
    stream: ({ params }) =>
      this.quizAttemptService.getAllQuizAttempts({
        searchTerm: params.searchTerm,
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        correctAnswers: params.correctAnswers ?? undefined,
      }),
  });

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
  }

  protected onCorrectAnswersChange(value: number | null | undefined): void {
    this.correctAnswers.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageNumber.set(event.first / event.rows + 1);
    this.pageSize.set(event.rows);
  }
}
