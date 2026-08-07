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
import { Quiz } from '@shared/models/quiz/quiz.model';
import { QuizService } from '@shared/services/quiz.service';

@Component({
  selector: 'qn-college-quizzes',
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
          title="Quiz Schedule"
          description="Track quiz ownership, score weight, and delivery state."
        />
      </header>

      <div class="filters-grid">
        <div class="filter-item">
          <label for="quiz-search">Search</label>
          <input
            class="focus-green-ring"
            id="quiz-search"
            [(ngModel)]="searchTerm"
            (ngModelChange)="pageNumber.set(1)"
            pInputText
            placeholder="Search by title, course, or instructor"
          />
        </div>

        <div class="filter-item">
          <label for="marks">Marks</label>
          <p-inputnumber
            [(ngModel)]="marks"
            [min]="0"
            [showButtons]="true"
            (ngModelChange)="onMarksChange($event)"
            inputId="marks"
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
          [totalRecords]="quizzesResource.value()?.totalCount ?? 0"
          [lazy]="true"
          [first]="(pageNumber() - 1) * pageSize()"
          [showFirstLastIcon]="false"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onPage)="onPageChange($event)"
        >
          <ng-template #header>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Instructor</th>
              <th>Marks</th>
              <th>Starts At</th>
              <th>Ends At</th>
              <th style="width: 8rem">State</th>
            </tr>
          </ng-template>
          <ng-template #body let-quiz>
            <tr>
              @if (quizzesResource.isLoading()) {
                <td><p-skeleton width="60%" height="1.5rem" /></td>
                <td><p-skeleton width="50%" height="1.5rem" /></td>
                <td><p-skeleton width="50%" height="1.5rem" /></td>
                <td><p-skeleton width="30%" height="1.5rem" /></td>
                <td><p-skeleton width="60%" height="1.5rem" /></td>
                <td><p-skeleton width="60%" height="1.5rem" /></td>
                <td><p-skeleton width="4rem" height="1.5rem" /></td>
              } @else {
                <td>{{ quiz.title }}</td>
                <td>{{ quiz.courseName }}</td>
                <td>{{ quiz.instructorName }}</td>
                <td>{{ quiz.marks }}</td>
                <td>
                  <time [attr.datetime]="quiz.startsAtUtc">{{
                    quiz.startsAtUtc | date: 'short'
                  }}</time>
                </td>
                <td>
                  <time [attr.datetime]="quiz.endsAtUtc">{{ quiz.endsAtUtc | date: 'short' }}</time>
                </td>
                <td>
                  <span class="state" [class]="quiz.state.toLowerCase()">{{ quiz.state }}</span>
                </td>
              }
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                @if (quizzesResource.error()) {
                  <div class="error">
                    <p>Failed to load quiz data.</p>
                  </div>
                } @else {
                  <p class="feedback">No quizzes match your filters.</p>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styleUrl: './college-quizzes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollegeQuizzes {
  private readonly appSettings = inject(APP_SETTINGS);
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly searchTerm = signal(this.route.snapshot.queryParams['search'] || '');
  protected readonly pageNumber = signal(Number(this.route.snapshot.queryParams['page']) || 1);
  protected readonly pageSize = signal(
    Number(this.route.snapshot.queryParams['size']) || this.appSettings.defaultPageSize,
  );
  protected readonly tableData = computed<Quiz[]>(() => {
    if (this.quizzesResource.isLoading()) {
      return Array.from<unknown, Quiz>(
        { length: this.pageSize() },
        (_, i) =>
          ({
            quizId: `skeleton-${i}`,
          }) as unknown as Quiz,
      );
    }
    if (this.quizzesResource.error()) {
      return [];
    }
    return this.quizzesResource.value()?.items ?? [];
  });
  protected readonly marks = signal<number | null>(
    this.route.snapshot.queryParams['marks']
      ? Number(this.route.snapshot.queryParams['marks'])
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
          marks: this.marks(),
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

  protected readonly quizzesResource = rxResource({
    params: () => ({
      searchTerm: this.debouncedSearchTerm(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      marks: this.marks(),
    }),
    stream: ({ params }) =>
      this.quizService.getAllQuizzes({
        searchTerm: params.searchTerm,
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        marks: params.marks ?? undefined,
      }),
  });

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
  }

  protected onMarksChange(value: number | null | undefined): void {
    this.marks.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageNumber.set(event.first / event.rows + 1);
    this.pageSize.set(event.rows);
  }
}
