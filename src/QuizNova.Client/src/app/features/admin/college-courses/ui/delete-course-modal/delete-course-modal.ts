import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

import { Course } from '@shared/models/course/course.model';
import { CoursesService } from '@shared/services/courses.service';

@Component({
  selector: 'qn-delete-course-modal',
  imports: [Dialog, Button],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      (onClick)="openDialog()"
      ariaLabel="Delete course"
      icon="pi pi-trash"
      severity="danger"
    />

    <p-dialog
      [visible]="isDialogOpen()"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(30rem, 95vw)' }"
      (visibleChange)="onDialogVisibilityChange($event)"
      header="Delete Course"
    >
      <p class="message">
        Are you sure you want to delete <strong>{{ course().courseName }}</strong
        >?
      </p>

      @if (submitError()) {
        <p class="submit-error">Failed to delete course. Please try again.</p>
      }

      <div class="actions">
        <p-button
          [text]="true"
          (onClick)="closeDialog()"
          label="Cancel"
          severity="secondary"
          type="button"
        />
        <p-button
          [loading]="isSubmitting()"
          (onClick)="onDelete()"
          label="Delete"
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
