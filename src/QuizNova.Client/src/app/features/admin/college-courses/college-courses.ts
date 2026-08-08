import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  model,
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
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { TableModule, TablePageEvent } from 'primeng/table';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { Course } from '@shared/models/course/course.model';
import { PaginatedList } from '@shared/models/pagination/paginated-list.model';
import { Instructor } from '@shared/models/users/instructor.model';
import { CoursesService } from '@shared/services/courses.service';
import { InstructorService } from '@shared/services/instructor.service';
import { shortId } from '@shared/utils/utilities';

import { AddCourseModal } from './ui/add-course-modal/add-course-modal';
import { DeleteCourseModal } from './ui/delete-course-modal/delete-course-modal';
import { ManageCourseModal } from './ui/manage-course-modal/manage-course-modal';

@Component({
  selector: 'qn-college-courses',
  imports: [
    AddCourseModal,
    DeleteCourseModal,
    ManageCourseModal,
    TableModule,
    Skeleton,
    FormsModule,
    InputText,
    InputNumber,
    Select,
    RoleDashboardHeader,
    TranslatePipe,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          [title]="tokens.ADMIN.COURSE_STATUS_TITLE | translate"
          [description]="tokens.ADMIN.COURSE_STATUS_DESC | translate"
        />
        <qn-add-course-modal (created)="reloadCourses()" />
      </header>

      <div class="filters-grid">
        <div class="filter-item">
          <label for="course-search">{{ tokens.COMMON.SEARCH | translate }}</label>
          <input
            class="focus-green-ring"
            id="course-search"
            [(ngModel)]="searchTerm"
            [placeholder]="tokens.ADMIN.SEARCH_COURSES_PLACEHOLDER | translate"
            (ngModelChange)="pageNumber.set(1)"
            pInputText
          />
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

        <div class="filter-item">
          <label for="enrolled-count">{{ tokens.ADMIN.ENROLLED_STUDENTS | translate }}</label>
          <p-inputnumber
            [(ngModel)]="enrolledStudentsCount"
            [min]="0"
            [showButtons]="true"
            [placeholder]="tokens.ADMIN.ANY | translate"
            (ngModelChange)="onEnrolledStudentsCountChange($event)"
            inputId="enrolled-count"
          ></p-inputnumber>
        </div>

        <div class="filter-item">
          <label for="instructor-filter">{{ tokens.COMMON.INSTRUCTOR | translate }}</label>
          <p-select
            [(ngModel)]="instructorId"
            [options]="instructorOptions()"
            [filter]="true"
            [showClear]="true"
            [placeholder]="tokens.ADMIN.ALL_INSTRUCTORS | translate"
            (ngModelChange)="pageNumber.set(1)"
            (onShow)="onInstructorDropdownShow()"
            inputId="instructor-filter"
            optionLabel="name"
            optionValue="id"
            filterBy="name"
            appendTo="body"
          ></p-select>
        </div>
      </div>

      <div class="table-shell">
        <p-table
          [value]="tableData()"
          [tableStyle]="{ 'min-width': '50rem' }"
          [paginator]="true"
          [rows]="pageSize()"
          [totalRecords]="coursesResource.value()?.totalCount ?? 0"
          [lazy]="true"
          [first]="(pageNumber() - 1) * pageSize()"
          [showFirstLastIcon]="false"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onPage)="onPageChange($event)"
        >
          <ng-template #header>
            <tr>
              <th>{{ tokens.COMMON.ID | translate }}</th>
              <th>{{ tokens.COMMON.COURSE | translate }}</th>
              <th>{{ tokens.COMMON.INSTRUCTOR | translate }}</th>
              <th>{{ tokens.ADMIN.ENROLLED_STUDENTS | translate }}</th>
              <th>{{ tokens.ADMIN.QUIZZES_COUNT | translate }}</th>
              <th style="width: 8rem">{{ tokens.COMMON.ACTIONS | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-course>
            <tr>
              @if (coursesResource.isLoading()) {
                <td><p-skeleton width="60%" height="1.5rem" /></td>
                <td><p-skeleton width="80%" height="1.5rem" /></td>
                <td><p-skeleton width="70%" height="1.5rem" /></td>
                <td><p-skeleton width="40%" height="1.5rem" /></td>
                <td><p-skeleton width="40%" height="1.5rem" /></td>
                <td><p-skeleton width="4rem" height="1.5rem" /></td>
              } @else {
                <td>{{ shortId(course.id) }}</td>
                <td>{{ course.courseName }}</td>
                <td>{{ course.instructorName || (tokens.ADMIN.UNASSIGNED | translate) }}</td>
                <td>{{ course.enrolledStudentsCount }}</td>
                <td>{{ course.quizzesCount }}</td>
                <td>
                  <div class="actions">
                    <qn-manage-course-modal [course]="course" (changed)="reloadCourses()" />
                    <qn-delete-course-modal [course]="course" (deleted)="reloadCourses()" />
                  </div>
                </td>
              }
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6">
                @if (coursesResource.error()) {
                  <div class="error">
                    <p>{{ tokens.ADMIN.FAILED_LOAD_COURSES | translate }}</p>
                  </div>
                } @else {
                  <p class="feedback">{{ tokens.ADMIN.NO_COURSES_MATCH | translate }}</p>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styleUrl: '../shared/college-tables-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollegeCourses {
  protected readonly tokens = TRANSLATION_TOKENS;
  private readonly appSettings = inject(APP_SETTINGS);
  private readonly coursesService = inject(CoursesService);
  private readonly instructorService = inject(InstructorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly shortId = shortId;

  protected readonly searchTerm = signal(this.route.snapshot.queryParams['search'] || '');
  protected readonly pageNumber = signal(Number(this.route.snapshot.queryParams['page']) || 1);
  protected readonly pageSize = signal(
    Number(this.route.snapshot.queryParams['size']) || this.appSettings.defaultPageSize,
  );
  protected readonly tableData = computed<Course[]>(() => {
    if (this.coursesResource.isLoading()) {
      return Array.from<unknown, Course>(
        { length: this.pageSize() },
        (_, i) =>
          ({
            id: `skeleton-${i}`,
          }) as unknown as Course,
      );
    }
    if (this.coursesResource.error()) {
      return [];
    }
    return this.coursesResource.value()?.items ?? [];
  });
  protected readonly quizzesCount = signal<number | null>(
    this.route.snapshot.queryParams['quizzes']
      ? Number(this.route.snapshot.queryParams['quizzes'])
      : null,
  );
  protected readonly enrolledStudentsCount = signal<number | null>(
    this.route.snapshot.queryParams['enrolled']
      ? Number(this.route.snapshot.queryParams['enrolled'])
      : null,
  );
  protected readonly instructorId = signal<string | null>(
    this.route.snapshot.queryParams['instructor'] || null,
  );

  constructor() {
    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchTerm() || null,
          page: this.pageNumber(),
          size: this.pageSize(),
          quizzes: this.quizzesCount(),
          enrolled: this.enrolledStudentsCount(),
          instructor: this.instructorId(),
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  protected readonly dropdownOpen = model(false);

  private readonly debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(
      map((value) => value?.trim() || ''),
      debounceTime(this.appSettings.debounceTimeMs),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly instructorsResource = rxResource({
    params: () => this.dropdownOpen(),
    stream: (shouldFetch) =>
      shouldFetch
        ? this.instructorService.getAllInstructors({
            pageNumber: 1,
            pageSize: 10,
          })
        : of({
            items: [],
            pageNumber: 1,
            pageSize: 10,
            totalPages: 1,
            totalCount: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          } as PaginatedList<Instructor>),
  });

  protected readonly instructorOptions = computed(() =>
    (this.instructorsResource.value()?.items ?? []).map((instructor: Instructor) => ({
      id: instructor.id,
      name: instructor.personalInformation.name,
    })),
  );

  protected readonly coursesResource = rxResource({
    params: () => ({
      searchTerm: this.debouncedSearchTerm(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      quizzesCount: this.quizzesCount(),
      enrolledStudentsCount: this.enrolledStudentsCount(),
      instructorId: this.instructorId(),
    }),
    stream: ({ params }) =>
      this.coursesService.getAllCourses({
        searchTerm: params.searchTerm,
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        quizzesCount: params.quizzesCount ?? undefined,
        enrolledStudentsCount: params.enrolledStudentsCount ?? undefined,
        instructorId: params.instructorId ?? undefined,
      }),
  });

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
  }

  protected onQuizzesCountChange(value: number | null | undefined): void {
    this.quizzesCount.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onEnrolledStudentsCountChange(value: number | null | undefined): void {
    this.enrolledStudentsCount.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onInstructorChange(value: string | null | undefined): void {
    this.instructorId.set(value ?? null);
    this.pageNumber.set(1);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageNumber.set(event.first / event.rows + 1);
    this.pageSize.set(event.rows);
  }

  protected onInstructorDropdownShow(): void {
    this.dropdownOpen.set(true);
  }

  protected reloadCourses(): void {
    this.coursesResource.reload();
  }
}
