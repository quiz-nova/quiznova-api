import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

import { Course } from '@shared/models/course/course.model';
import { CoursesService } from '@shared/services/courses.service';

@Component({
  selector: 'qn-delete-course-modal',
  imports: [Dialog, Button, TranslatePipe],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      [ariaLabel]="tokens.COMMON.DELETE_ACTION | translate"
      (onClick)="openDialog()"
      icon="pi pi-trash"
      severity="danger"
    />

    <p-dialog
      [visible]="isDialogOpen()"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(30rem, 95vw)' }"
      [header]="tokens.ADMIN.DELETE_COURSE_TITLE | translate"
      (visibleChange)="onDialogVisibilityChange($event)"
    >
      <p class="message">
        {{ tokens.ADMIN.DELETE_COURSE_CONFIRM | translate }}
        <strong>{{ course().courseName }}</strong
        >?
      </p>

      @if (submitError()) {
        <p class="submit-error">{{ tokens.ADMIN.FAILED_DELETE_COURSE | translate }}</p>
      }

      <div class="actions">
        <p-button
          [text]="true"
          [label]="tokens.COMMON.CANCEL | translate"
          (onClick)="closeDialog()"
          severity="secondary"
          type="button"
        />
        <p-button
          [loading]="isSubmitting()"
          [label]="tokens.COMMON.DELETE_ACTION | translate"
          (onClick)="onDelete()"
          severity="danger"
          type="button"
        />
      </div>
    </p-dialog>
  `,
  styleUrl: './delete-course-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteCourseModal {
  protected readonly tokens = TRANSLATION_TOKENS;
  private readonly coursesService = inject(CoursesService);

  readonly course = input.required<Course>();
  readonly deleted = output<void>();

  protected readonly isDialogOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal(false);

  protected openDialog(): void {
    this.submitError.set(false);
    this.isDialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.isDialogOpen.set(false);
  }

  protected onDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.closeDialog();
      return;
    }

    this.isDialogOpen.set(true);
  }

  protected onDelete(): void {
    this.isSubmitting.set(true);
    this.submitError.set(false);

    this.coursesService.deleteCourse(this.course().id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.deleted.emit();
        this.closeDialog();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set(true);
      },
    });
  }
}
