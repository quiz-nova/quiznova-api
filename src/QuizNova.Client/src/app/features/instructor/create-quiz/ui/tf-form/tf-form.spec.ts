import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuestionType } from '@shared/models/quiz/question.model';
import { Tf } from '@shared/models/quiz/questions/tf.model';

import { TfForm } from './tf-form';

const mockTfQuestion: Tf = {
  id: 'tf-1',
  quizId: 'quiz-1',
  questionText: 'Angular is a framework.',
  correctChoice: true,
  marks: 2,
  displayOrder: 1,
  type: QuestionType.Tf,
};

describe('TfForm Component', () => {
  it('should initialize and populate question text and correct answer selection', async () => {
    await render(TfForm, {
      inputs: { initialData: mockTfQuestion },
    });

    const questionInput = screen.getByLabelText(/Question Text/i) as HTMLTextAreaElement;
    expect(questionInput.value).toBe('Angular is a framework.');
  });

  it('should throw an error if initialized with non-TF question data', async () => {
    const invalidEssayData = {
      id: 'essay-1',
      quizId: 'quiz-1',
      questionText: 'Essay Text',
      type: QuestionType.Essay,
      marks: 5,
    } as any;

    await expect(
      render(TfForm, {
        inputs: { initialData: invalidEssayData },
      }),
    ).rejects.toThrow(/Expected True\/False question data/);
  });

  it('should emit valueChange when radio selection changes', async () => {
    const valueChangeSpy = vi.fn();

    await render(TfForm, {
      inputs: { initialData: mockTfQuestion },
      on: { valueChange: valueChangeSpy },
    });

    const user = userEvent.setup();
    const falseRadio = screen.getByText('False');

    await user.click(falseRadio);

    expect(valueChangeSpy).toHaveBeenCalled();
    const lastCall = valueChangeSpy.mock.calls.at(-1)![0] as Tf;
    expect(lastCall.correctChoice).toBe(false);
  });

  it('should emit questionTextBlur on question title blur', async () => {
    const questionTextBlurSpy = vi.fn();

    await render(TfForm, {
      inputs: { initialData: mockTfQuestion },
      on: { questionTextBlur: questionTextBlurSpy },
    });

    const user = userEvent.setup();
    const questionInput = screen.getByLabelText(/Question Text/i);

    await user.click(questionInput);
    await user.tab();

    expect(questionTextBlurSpy).toHaveBeenCalledWith({
      questionId: 'tf-1',
      text: 'Angular is a framework.',
    });
  });
});
