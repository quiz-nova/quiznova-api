import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuestionType } from '@shared/models/quiz/question.model';

import { AddQuestion } from './add-question';
import { CreateQuizStore } from '../../stores/create-quiz.store';
import { DEFAULT_MARKS } from '../../utils/question-type.mapper';

describe('AddQuestion Component', () => {
  const mockStore = {
    canAddMoreQuestions: vi.fn().mockReturnValue(true),
    effectiveRemainingMarks: vi.fn().mockReturnValue(15),
    numberOfQuestions: vi.fn().mockReturnValue(2),
    questions: vi.fn().mockReturnValue([]),
  };

  it('should render question type options and add button', async () => {
    await render(AddQuestion, {
      providers: [provideTranslateService()],
      componentProviders: [{ provide: CreateQuizStore, useValue: mockStore }],
    });

    const label = screen.getByText(TRANSLATION_TOKENS.INSTRUCTOR.QUESTION_TYPE);
    expect(label).toBeInTheDocument();

    const addButton = screen.getByRole('button', {
      name: TRANSLATION_TOKENS.INSTRUCTOR.ADD_QUESTION,
    });
    expect(addButton).toBeEnabled();
  });

  it('should emit questionAdded event when +Add Question button is clicked', async () => {
    const questionAddedSpy = vi.fn();

    await render(AddQuestion, {
      providers: [provideTranslateService()],
      componentProviders: [{ provide: CreateQuizStore, useValue: mockStore }],
      on: { questionAdded: questionAddedSpy },
    });

    const user = userEvent.setup();
    const addButton = screen.getByRole('button', {
      name: TRANSLATION_TOKENS.INSTRUCTOR.ADD_QUESTION,
    });

    await user.click(addButton);

    expect(questionAddedSpy).toHaveBeenCalled();
    const createdQuestion = questionAddedSpy.mock.calls[0][0];
    expect(createdQuestion.type).toBe(QuestionType.Mcq);
    expect(createdQuestion.marks).toBe(DEFAULT_MARKS);
  });

  it('should disable +Add Question button when store.canAddMoreQuestions() returns false', async () => {
    const disabledStore = {
      ...mockStore,
      canAddMoreQuestions: vi.fn().mockReturnValue(false),
    };

    await render(AddQuestion, {
      providers: [provideTranslateService()],
      componentProviders: [{ provide: CreateQuizStore, useValue: disabledStore }],
    });

    const addButton = screen.getByRole('button', {
      name: TRANSLATION_TOKENS.INSTRUCTOR.ADD_QUESTION,
    });
    expect(addButton).toBeDisabled();
  });
});
