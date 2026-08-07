import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

import { Instructor } from '@shared/models/users/instructor.model';
import { InstructorService } from '@shared/services/instructor.service';

@Component({
  selector: 'qn-delete-instructor-modal',
  imports: [Dialog, Button],
  template: `
    <p-button
      [rounded]="true"
      [text]="true"
      (onClick)="openDialog()"
      ariaLabel="Delete instructor"
      icon="pi pi-trash"
      severity="danger"
    />

    <p-dialog
      [visible]="isDialogOpen()"
      [modal]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(30rem, 95vw)' }"
      (visibleChange)="onDialogVisibilityChange($event)"
      header="Delete Instructor"
    >
      <p class="message">
        Are you sure you want to delete <strong>{{ instructor().personalInformation.name }}</strong
        >?
      </p>

      @if (submitError()) {
        <p class="submit-error">Failed to delete instructor. Please try again.</p>
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
  styleUrl: './delete-instructor-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteInstructorModal {
  private readonly instructorService = inject(InstructorService);

  readonly instructor = input.required<Instructor>();
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

    this.instructorService.deleteInstructor(this.instructor().id).subscribe({
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
