import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuestionType } from '@shared/models/quiz/question.model';
import { Mcq } from '@shared/models/quiz/questions/mcq.model';

import { McqForm } from './mcq-form';

const mockMcqQuestion: Mcq = {
  id: 'q-101',
  quizId: 'quiz-1',
  questionText: 'What is the capital of Egypt?',
  correctChoiceId: 'choice-a',
  numberOfChoices: 2,
  displayOrder: 1,
  marks: 1,
  choices: [
    { id: 'choice-a', questionId: 'q-101', text: 'Cairo', displayOrder: 1 },
    { id: 'choice-b', questionId: 'q-101', text: 'Alexandria', displayOrder: 2 },
  ],
  type: QuestionType.Mcq,
};

describe('McqForm Component', () => {
  it('should initialize and populate the form with initialData', async () => {
    await render(McqForm, {
      inputs: { initialData: mockMcqQuestion },
    });

    const firstChoiceInput = screen.getByLabelText(/Text for choice 1/i) as HTMLInputElement;
    const secondChoiceInput = screen.getByLabelText(/Text for choice 2/i) as HTMLInputElement;

    expect(firstChoiceInput.value).toBe('Cairo');
    expect(secondChoiceInput.value).toBe('Alexandria');
  });

  it('should throw an error if initialized with non-MCQ question data', async () => {
    const invalidEssayQuestion = {
      id: 'q-999',
      quizId: 'quiz-1',
      questionText: 'Essay Text',
      type: QuestionType.Essay,
      marks: 5,
    } as any;

    await expect(
      render(McqForm, {
        inputs: { initialData: invalidEssayQuestion },
      }),
    ).rejects.toThrow();
  });

  it('should disable delete buttons initially when choices are <= 2', async () => {
    await render(McqForm, {
      inputs: { initialData: mockMcqQuestion },
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Delete choice/i });
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).toBeDisabled();
  });

  it('should allow adding new choices up to a maximum of 5 items', async () => {
    await render(McqForm, {
      inputs: { initialData: mockMcqQuestion },
    });
    const user = userEvent.setup();

    const addChoiceButton = screen.getByRole('button', { name: /Add Choice/i });

    await user.click(addChoiceButton);
    await user.click(addChoiceButton);
    await user.click(addChoiceButton);

    const inputs = screen.getAllByPlaceholderText('Enter choice text...');
    expect(inputs).toHaveLength(5);
    expect(addChoiceButton).toBeDisabled();
  });

  it('should display validation errors when dynamic choices are emptied or invalid', async () => {
    await render(McqForm, {
      inputs: { initialData: mockMcqQuestion },
    });
    const user = userEvent.setup();

    const firstChoiceInput = screen.getByLabelText(/Text for choice 1/i);

    await user.clear(firstChoiceInput);
    await user.tab();

    const errorMsg = await screen.findByText('Choice text is required.');
    expect(errorMsg).toBeInTheDocument();
  });

  it('should emit valueChange when input form fields are edited', async () => {
    const valueChangeSpy = vi.fn();

    await render(McqForm, {
      inputs: { initialData: mockMcqQuestion },
      on: { valueChange: valueChangeSpy },
    });
    const user = userEvent.setup();

    const firstChoiceInput = screen.getByLabelText(/Text for choice 1/i);
    await user.type(firstChoiceInput, ' Modified');

    expect(valueChangeSpy).toHaveBeenCalled();
    const lastCall = valueChangeSpy.mock.calls.at(-1)![0] as Mcq;
    expect(lastCall.choices[0].text).toBe('Cairo Modified');
  });

  it('should reset correctChoiceId if the active correct answer is deleted', async () => {
    const deleteChoiceSpy = vi.fn();
    await render(McqForm, {
      inputs: { initialData: mockMcqQuestion },
      on: { deleteChoice: deleteChoiceSpy },
    });
    const user = userEvent.setup();

    const addChoiceButton = screen.getByRole('button', { name: /Add Choice/i });
    await user.click(addChoiceButton);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete choice/i });
    expect(deleteButtons[0]).toBeEnabled();
    await user.click(deleteButtons[0]);

    expect(deleteChoiceSpy).toHaveBeenCalledWith({ questionId: 'q-101', choiceId: 'choice-a' });
  });
});
