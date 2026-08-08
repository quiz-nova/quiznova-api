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
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { TableModule, TablePageEvent } from 'primeng/table';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { RoleDashboardHeader } from '@shared/components/role-dashboard-header/role-dashboard-header';
import { User } from '@shared/models/users/user.model';
import { AdminService } from '@shared/services/admin.service';

import { AddAdminModal } from './ui/add-admin-modal/add-admin-modal';

@Component({
  selector: 'qn-college-admins',
  imports: [
    TableModule,
    Skeleton,
    AddAdminModal,
    FormsModule,
    InputText,
    RoleDashboardHeader,
    TranslatePipe,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <qn-role-dashboard-header
          [title]="tokens.ADMIN.ADMIN_DIRECTORY | translate"
          [description]="tokens.ADMIN.ADMIN_DIRECTORY_DESC | translate"
        />
        <qn-add-admin-modal (created)="reloadAdmins()"></qn-add-admin-modal>
      </header>

      <div class="filters-grid">
        <div class="filter-item">
          <label for="admin-search">{{ tokens.COMMON.SEARCH | translate }}</label>
          <input
            class="focus-green-ring"
            id="admin-search"
            [(ngModel)]="searchTerm"
            [placeholder]="tokens.ADMIN.SEARCH_ADMINS_PLACEHOLDER | translate"
            (ngModelChange)="pageNumber.set(1)"
            pInputText
          />
        </div>
      </div>

      <div class="table-shell">
        <p-table
          [value]="tableData()"
          [tableStyle]="{ 'min-width': '50rem' }"
          [paginator]="true"
          [rows]="pageSize()"
          [totalRecords]="adminsResource.value()?.totalCount ?? 0"
          [lazy]="true"
          [first]="(pageNumber() - 1) * pageSize()"
          [showFirstLastIcon]="false"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onPage)="onPageChange($event)"
        >
          <ng-template #header>
            <tr>
              <th>{{ tokens.COMMON.NAME | translate }}</th>
              <th>{{ tokens.COMMON.EMAIL | translate }}</th>
            </tr>
          </ng-template>
          <ng-template #body let-admin>
            <tr>
              @if (adminsResource.isLoading()) {
                <td><p-skeleton width="60%" height="1.5rem" /></td>
                <td><p-skeleton width="80%" height="1.5rem" /></td>
              } @else {
                <td>{{ admin.personalInformation.name }}</td>
                <td>{{ admin.personalInformation.email }}</td>
              }
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="2">
                @if (adminsResource.error()) {
                  <div class="error">
                    <p>{{ tokens.ADMIN.FAILED_LOAD_ADMINS | translate }}</p>
                  </div>
                } @else {
                  <p class="feedback">{{ tokens.ADMIN.NO_ADMINS_MATCH | translate }}</p>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styleUrl: './college-admins.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollegeAdmins {
  protected readonly tokens = TRANSLATION_TOKENS;
  private readonly appSettings = inject(APP_SETTINGS);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly searchTerm = signal(this.route.snapshot.queryParams['search'] || '');
  protected readonly pageNumber = signal(Number(this.route.snapshot.queryParams['page']) || 1);
  protected readonly pageSize = signal(
    Number(this.route.snapshot.queryParams['size']) || this.appSettings.defaultPageSize,
  );
  protected readonly tableData = computed<User[]>(() => {
    if (this.adminsResource.isLoading()) {
      return Array.from<unknown, User>(
        { length: this.pageSize() },
        (_, i) =>
          ({
            id: `skeleton-${i}`,
          }) as unknown as User,
      );
    }
    if (this.adminsResource.error()) {
      return [];
    }
    return this.adminsResource.value()?.items ?? [];
  });

  constructor() {
    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: this.searchTerm() || null,
          page: this.pageNumber(),
          size: this.pageSize(),
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

  protected readonly adminsResource = rxResource({
    params: () => ({
      searchTerm: this.debouncedSearchTerm(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    }),
    stream: ({ params }) =>
      this.adminService.getAllAdmins({
        searchTerm: params.searchTerm,
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
      }),
  });

  protected onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageNumber.set(event.first / event.rows + 1);
    this.pageSize.set(event.rows);
  }

  protected reloadAdmins(): void {
    this.adminsResource.reload();
  }
}
