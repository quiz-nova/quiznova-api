import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MessageService } from 'primeng/api';

import { FieldError } from '@shared/components/field-error/field-error';
import { AnswerReviewContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import {
  QuestionAnswer,
  EssayAnswer,
  isEssayAnswer,
} from '@shared/models/quiz-attempt/question-answer.model';
import { QuizAttemptService } from '@shared/services/quiz-attempt.service';
import { CustomValidators } from '@shared/validators/custom-validators';

@Component({
  selector: 'qn-essay-answer-grading',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <div class="essay-section">
      <!-- Student response box -->
      <div class="student-response">
        <p class="response-label">
          <i class="fa-solid fa-pen-nib"></i>
          Student's Response
        </p>
        <blockquote class="response-text">
          {{ essayAnswer().studentResponse || 'No response provided.' }}
        </blockquote>
      </div>

      <!-- Grading form -->
      <form
        class="grade-form"
        [formGroup]="form"
        [id]="'grade-form-' + essayAnswer().answerId"
        (ngSubmit)="submitGrade()"
      >
        <!-- Score -->
        <div class="field-group">
          <label class="field-label" [for]="'score-' + essayAnswer().answerId">
            Score
            <span class="max-marks">/ {{ question().marks }}</span>
          </label>
          <input
            class="score-input"
            [id]="'score-' + essayAnswer().answerId"
            [formControl]="scoreControl"
            [min]="0"
            [max]="question().marks"
            [attr.aria-describedby]="'score-error-' + essayAnswer().answerId"
            type="number"
            placeholder="0"
          />
          <qn-field-error [id]="'score-error-' + essayAnswer().answerId">
            @if (scoreControl.touched && scoreControl.errors?.['required']) {
              Score is required.
            } @else if (scoreControl.touched && scoreControl.errors?.['min']) {
              Score cannot be negative.
            } @else if (scoreControl.touched && scoreControl.errors?.['max']) {
              Score cannot exceed {{ question().marks }}.
            }
          </qn-field-error>
        </div>

        <!-- Feedback -->
        <div class="field-group">
          <label class="field-label" [for]="'feedback-' + essayAnswer().answerId">
            Feedback
            <span class="optional-tag">optional</span>
          </label>
          <textarea
            class="feedback-textarea"
            [id]="'feedback-' + essayAnswer().answerId"
            [formControl]="feedbackControl"
            [attr.aria-describedby]="'feedback-error-' + essayAnswer().answerId"
            rows="3"
            placeholder="Leave a note for the student (3–200 characters)..."
          ></textarea>
          <div class="feedback-footer">
            <qn-field-error [id]="'feedback-error-' + essayAnswer().answerId">
              @if (feedbackControl.touched && feedbackControl.errors?.['minlength']) {
                Feedback must be at least 3 characters.
              } @else if (feedbackControl.touched && feedbackControl.errors?.['maxlength']) {
                Feedback must not exceed 200 characters.
              }
            </qn-field-error>
            <span class="char-count" [class.over-limit]="feedbackLength > 200">
              {{ feedbackLength }}/200
            </span>
          </div>
        </div>

        <!-- Actions row -->
        <div class="form-actions">
          @if (saved) {
            <div class="saved-badge">
              <i class="fa-solid fa-circle-check"></i>
              Graded
            </div>
          }
          @if (error) {
            <span class="save-error">{{ error }}</span>
          }
          <button
            class="save-btn"
            [disabled]="saving || form.invalid"
            [attr.aria-busy]="saving"
            [id]="'save-btn-' + essayAnswer().answerId"
            type="submit"
          >
            @if (saving) {
              <i class="fa-solid fa-spinner fa-spin"></i>
              Saving...
            } @else {
              <i class="fa-solid fa-floppy-disk"></i>
              Save Grade
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: './essay-answer-grading.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayAnswerGrading implements AnswerReviewContract, OnInit {
  readonly question = input.required<Question>();
  readonly answer = input<QuestionAnswer | null>(null);
  readonly graded = output<void>();

  private readonly quizAttemptService = inject(QuizAttemptService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly essayAnswer = computed<EssayAnswer>(() => {
    const a = this.answer();
    if (a === null) {
      throw new Error('[EssayAnswerGrading] Answer input is required but was not provided.');
    }
    if (!isEssayAnswer(a)) {
      throw new Error(`[EssayAnswerGrading] Expected EssayAnswer, but received: ${a.answerType}`);
    }
    return a;
  });

  protected form!: FormGroup<{
    score: FormControl<number | null>;
    feedback: FormControl<string | null>;
  }>;

  protected saving = false;
  protected saved = false;
  protected error: string | null = null;

  ngOnInit(): void {
    const manualAnswer = this.essayAnswer();
    const maxMarks = this.question().marks;

    this.form = new FormGroup({
      score: new FormControl<number | null>(manualAnswer?.score ?? null, [
        Validators.required,
        Validators.min(0),
        Validators.max(maxMarks),
      ]),
      feedback: new FormControl<string | null>(manualAnswer?.feedback ?? null, [
        CustomValidators.trimMinLength(3),
        CustomValidators.trimMaxLength(200),
      ]),
    });

    if (manualAnswer?.score !== null && manualAnswer?.score !== undefined) {
      this.saved = true;
    }
  }

  protected get scoreControl() {
    return this.form.controls.score;
  }

  protected get feedbackControl() {
    return this.form.controls.feedback;
  }

  protected get feedbackLength(): number {
    return (this.form.controls.feedback.value ?? '').length;
  }

  protected submitGrade(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const manualAnswer = this.essayAnswer();
    if (!manualAnswer) return;

    const score = this.form.controls.score.value!;
    const feedback = this.form.controls.feedback.value ?? undefined;

    this.saving = true;
    this.saved = false;
    this.error = null;

    this.quizAttemptService.gradeAnswer(manualAnswer.answerId, score, feedback).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        this.graded.emit();
        this.messageService.add({
          severity: 'success',
          summary: 'Grade Saved',
          detail: 'Essay response graded successfully.',
        });
        this.router.navigate(['/instructor/grade']);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save grade. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Grading Failed',
          detail: 'Failed to save grade. Please try again.',
        });
      },
    });
  }
}
