import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { distinctUntilChanged, startWith } from 'rxjs';

import { FieldError } from '@shared/components/field-error/field-error';
import { QuestionAttemptContract } from '@shared/models/quiz/question-component.contracts';
import { Question } from '@shared/models/quiz/question.model';
import { Essay, isEssay } from '@shared/models/quiz/questions/essay.model';

import { SubmitEssayAnswer } from '../../models/SubmitQuizAttempt.model';
import { QuizAttemptStore } from '../../quiz-attempt.store';

export type EssayAttemptForm = FormGroup<{
  studentResponse: FormControl<string | null>;
}>;

@Component({
  selector: 'qn-essay-attempt',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <article class="question-card" aria-label="Essay question">
      <h2>{{ question().questionText }}</h2>

      <form class="essay-form" [formGroup]="essayAttemptForm">
        <textarea
          class="response-input"
          [class.invalid]="studentResponseControl.invalid && studentResponseControl.touched"
          [attr.aria-invalid]="
            studentResponseControl.invalid && studentResponseControl.touched ? 'true' : null
          "
          [formControl]="studentResponseControl"
          placeholder="Type your answer here..."
          rows="6"
          aria-describedby="essay-response-error"
        ></textarea>
        @if (studentResponseControl.invalid && studentResponseControl.touched) {
          <qn-field-error id="essay-response-error"
            >Response must be between 3 and 1000 characters.</qn-field-error
          >
        }
      </form>
    </article>
  `,
  styleUrl: './essay-attempt.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayAttempt implements QuestionAttemptContract, OnInit {
  protected readonly quizAttemptStore = inject(QuizAttemptStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly question = input.required<Question>();
  protected readonly essay = computed<Essay>(() => {
    const q = this.question();
    if (!isEssay(q)) {
      throw new Error(`[EssayAttempt] Expected Essay question, but received: ${q.type}`);
    }
    return q;
  });
  private readonly fb = inject(FormBuilder);

  protected get studentResponseControl() {
    return this.essayAttemptForm.controls.studentResponse;
  }

  protected readonly essayAttemptForm: EssayAttemptForm = this.fb.group({
    studentResponse: this.fb.control<string | null>(null, {
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(1000)],
    }),
  });

  ngOnInit(): void {
    this.studentResponseControl.valueChanges
      .pipe(
        startWith(this.studentResponseControl.value),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (response === null || response.length < 3) return;

        const answer: SubmitEssayAnswer = {
          questionId: this.question().id,
          studentResponse: response,
          type: 'essay',
        };

        this.quizAttemptStore.setCurrentAnswerDraft(answer);
      });
  }
}
