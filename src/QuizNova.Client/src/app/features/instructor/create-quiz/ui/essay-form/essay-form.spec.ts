import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuestionType } from '@shared/models/quiz/question.model';
import { Essay } from '@shared/models/quiz/questions/essay.model';

import { EssayForm } from './essay-form';

const mockEssayQuestion: Essay = {
  id: 'essay-1',
  quizId: 'quiz-1',
  questionText: 'Explain Clean Architecture principles.',
  answerReference: 'Separation of concerns, dependency rule, domain core.',
  marks: 5,
  displayOrder: 1,
  type: QuestionType.Essay,
};

describe('EssayForm Component', () => {
  it('should initialize and populate questionText and answerReference', async () => {
    await render(EssayForm, {
      inputs: { initialData: mockEssayQuestion },
    });

    const questionInput = screen.getByLabelText(/Question Text/i) as HTMLTextAreaElement;
    const referenceInput = screen.getByLabelText(/Expected Answer/i) as HTMLTextAreaElement;

    expect(questionInput.value).toBe('Explain Clean Architecture principles.');
    expect(referenceInput.value).toBe('Separation of concerns, dependency rule, domain core.');
  });

  it('should throw an error if initialized with non-Essay data', async () => {
    const invalidMcqData = {
      id: 'mcq-1',
      quizId: 'quiz-1',
      questionText: 'MCQ Text',
      type: QuestionType.Mcq,
      marks: 2,
    } as any;

    await expect(
      render(EssayForm, {
        inputs: { initialData: invalidMcqData },
      }),
    ).rejects.toThrow(/Expected Essay question data/);
  });

  it('should emit valueChange when form fields change', async () => {
    const valueChangeSpy = vi.fn();

    await render(EssayForm, {
      inputs: { initialData: mockEssayQuestion },
      on: { valueChange: valueChangeSpy },
    });

    const user = userEvent.setup();
    const referenceInput = screen.getByLabelText(/Expected Answer/i);

    await user.type(referenceInput, ' Added detail.');

    expect(valueChangeSpy).toHaveBeenCalled();
    const lastCall = valueChangeSpy.mock.calls.at(-1)![0] as Essay;
    expect(lastCall.answerReference).toContain('Added detail.');
  });

  it('should emit questionTextBlur and blurEvent on title blur', async () => {
    const blurEventSpy = vi.fn();
    const questionTextBlurSpy = vi.fn();

    await render(EssayForm, {
      inputs: { initialData: mockEssayQuestion },
      on: {
        blurEvent: blurEventSpy,
        questionTextBlur: questionTextBlurSpy,
      },
    });

    const user = userEvent.setup();
    const questionInput = screen.getByLabelText(/Question Text/i);

    await user.click(questionInput);
    await user.tab();

    expect(questionTextBlurSpy).toHaveBeenCalledWith({
      questionId: 'essay-1',
      text: 'Explain Clean Architecture principles.',
    });
    expect(blurEventSpy).toHaveBeenCalled();
  });
});
