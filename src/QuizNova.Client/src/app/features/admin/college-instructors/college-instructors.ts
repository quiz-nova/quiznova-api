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
import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { TableModule, TablePageEvent } from 'primeng/table';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { Instructor } from '@shared/models/users/instructor.model';
import { InstructorService } from '@shared/services/instructor.service';

import { AddInstructorModal } from './ui/add-instructor-modal/add-instructor-modal';
import { DeleteInstructorModal } from './ui/delete-instructor-modal/delete-instructor-modal';
import { EditInstructorModal } from './ui/edit-instructor-modal/edit-instructor-modal';

@Component({
  selector: 'qn-college-instructors',
  imports: [
    TableModule,
    Skeleton,
    AddInstructorModal,
    EditInstructorModal,
    DeleteInstructorModal,
    FormsModule,
    InputText,
    InputNumber,
    RoleDashboardHeader,
    TranslatePipe,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          [title]="tokens.ADMIN.INSTRUCTOR_DIRECTORY | translate"
          [description]="tokens.ADMIN.INSTRUCTOR_DIRECTORY_DESC | translate"
        />
        <qn-add-instructor-modal (created)="reloadInstructors()"></qn-add-instructor-modal>
      </header>

      <div class="filters-grid">
        <div class="filter-item">
          <label for="instructor-search">{{ tokens.COMMON.SEARCH | translate }}</label>
          <input
            class="focus-green-ring"
            id="instructor-search"
            [(ngModel)]="searchTerm"
            [placeholder]="tokens.ADMIN.SEARCH_INSTRUCTORS_PLACEHOLDER | translate"
            (ngModelChange)="pageNumber.set(1)"
            pInputText
          />
        </div>

        <div class="filter-item">
          <label for="courses-count">{{ tokens.ADMIN.COURSES_COUNT | translate }}</label>
          <p-inputnumber
            [(ngModel)]="coursesCount"
            [min]="0"
            [showButtons]="true"
            [placeholder]="tokens.ADMIN.ANY | translate"
            (ngModelChange)="onCoursesCountChange($event)"
            inputId="courses-count"
          ></p-inputnumber>
        </div>

        <div class="filter-item">
          <label for="quizzes-count">{{ tokens.ADMIN.QUIZZES_COUNT | translate }}</label>
          <p-inputnumber
            [(ngModel)]="quizzesCount"
            [min]="0"
            [showButtons]="true"
            [placeholder]="tokens.ADMIN.ANY | translate"
            (ngModelChange)="onQuizzesCountChange($event)"
            inputId="quizzes-count"
          ></p-inputnumber>
        </div>
      </div>

      <div class="table-shell">
        <p-table
          [value]="tableData()"
          [tableStyle]="{ 'min-width': '50rem' }"
          [paginator]="true"
          [rows]="pageSize()"
          [totalRecords]="instructorsResource.value()?.totalCount ?? 0"
          [lazy]="true"
          [first]="(pageNumber() - 1) * pageSize()"
          [showFirstLastIcon]="false"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onPage)="onPageChange($event)"
        >
          <ng-template #header>
            <tr>
              <th>{{ tokens.COMMON.NAME | translate }}</th>
              <th>{{ tokens.ADMIN.COURSES_COUNT | translate }}</th>
              <th>{{ tokens.ADMIN.QUIZZES_COUNT | translate }}</th>
              <th style="width: 8rem">{{ tokens.COMMON.ACTIONS | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-instructor>
            <tr>
              @if (instructorsResource.isLoading()) {
                <td><p-skeleton width="60%" height="1.5rem" /></td>
                <td><p-skeleton width="40%" height="1.5rem" /></td>
                <td><p-skeleton width="40%" height="1.5rem" /></td>
                <td><p-skeleton width="4rem" height="1.5rem" /></td>
              } @else {
                <td>{{ instructor.personalInformation.name }}</td>
                <td>{{ instructor.coursesCount }}</td>
                <td>{{ instructor.quizzesCount }}</td>
                <td>
                  <div class="actions">
                    <qn-edit-instructor-modal
                      [instructor]="instructor"
                      (updated)="reloadInstructors()"
                    ></qn-edit-instructor-modal>
                    <qn-delete-instructor-modal
                      [instructor]="instructor"
                      (deleted)="reloadInstructors()"
                    ></qn-delete-instructor-modal>
                  </div>
                </td>
              }
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="4">
                @if (instructorsResource.error()) {
                  <div class="error">
                    <p>{{ tokens.ADMIN.FAILED_LOAD_INSTRUCTORS | translate }}</p>
                  </div>
                } @else {
                  <p class="feedback">{{ tokens.ADMIN.NO_INSTRUCTORS_MATCH | translate }}</p>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styleUrl: './college-instructors.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollegeInstructors {
  protected readonly tokens = TRANSLATION_TOKENS;
  private readonly instructorService = inject(InstructorService);
  private readonly appSettings = inject(APP_SETTINGS);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly searchTerm = signal(this.route.snapshot.queryParams['search'] || '');
  protected readonly pageNumber = signal(Number(this.route.snapshot.queryParams['page']) || 1);
  protected readonly pageSize = signal(
    Number(this.route.snapshot.queryParams['size']) || this.appSettings.defaultPageSize,
  );
  protected readonly tableData = computed<Instructor[]>(() => {
    if (this.instructorsResource.isLoading()) {
      return Array.from<unknown, Instructor>(
        { length: this.pageSize() },
        (_, i) =>
          ({
            id: `skeleton-${i}`,
          }) as unknown as Instructor,
      );
    }
    if (this.instructorsResource.error()) {
      return [];
    }
    return this.instructorsResource.value()?.items ?? [];
  });
  protected readonly coursesCount = signal<number | null>(
    this.route.snapshot.queryParams['courses']
      ? Number(this.route.snapshot.queryParams['courses'])
      : null,
  );
  protected readonly quizzesCount = signal<number | null>(
    this.route.snapshot.queryParams['quizzes']
      ? Number(this.route.snapshot.queryParams['quizzes'])
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
          courses: this.coursesCount(),
          quizzes: this.quizzesCount(),
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

  protected readonly instructorsResource = rxResource({
    params: () => ({
      searchTerm: this.debouncedSearchTerm(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      coursesCount: this.coursesCount(),
      quizzesCount: this.quizzesCount(),
    }),
    stream: ({ params }) =>
      this.instructorService.getAllInstructors({
        searchTerm: params.searchTerm,
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        coursesCount: params.coursesCount ?? undefined,
        quizzesCount: params.quizzesCount ?? undefined,
      }),
  });

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
  }

  protected onCoursesCountChange(value: number | null | undefined): void {
    this.coursesCount.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onQuizzesCountChange(value: number | null | undefined): void {
    this.quizzesCount.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageNumber.set(event.first / event.rows + 1);
    this.pageSize.set(event.rows);
  }

  protected reloadInstructors(): void {
    this.instructorsResource.reload();
  }
}
