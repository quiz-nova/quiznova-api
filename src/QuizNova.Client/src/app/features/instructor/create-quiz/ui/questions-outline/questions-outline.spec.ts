import { signal } from '@angular/core';

import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Question, QuestionType } from '@shared/models/quiz/question.model';

import { QuestionsOutline } from './questions-outline';
import { CreateQuizStore } from '../../stores/create-quiz.store';

describe('QuestionsOutline Component', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q-1',
      quizId: 'quiz-1',
      questionText: 'First Question Title',
      marks: 3,
      type: QuestionType.Mcq,
      displayOrder: 1,
    },
    {
      id: 'q-2',
      quizId: 'quiz-1',
      questionText: 'Second Question Title',
      marks: 4,
      type: QuestionType.Essay,
      displayOrder: 2,
    },
  ];

  const mockStore = {
    questions: signal(mockQuestions),
    activeQuestionId: signal('q-1'),
    effectiveRemainingMarks: signal(8),
  };

  it('should render question count and remaining marks', async () => {
    const { container } = await render(QuestionsOutline, {
      providers: [provideTranslateService()],
      componentProviders: [{ provide: CreateQuizStore, useValue: mockStore }],
    });

    expect(screen.getByText(TRANSLATION_TOKENS.INSTRUCTOR.QUESTIONS_OUTLINE)).toBeInTheDocument();
    const counter = container.querySelector('.questions-outline__counter');
    expect(counter?.textContent?.trim()).toBe('2');
    expect(
      screen.getByText(new RegExp(`8.*${TRANSLATION_TOKENS.COMMON.POINTS}`)),
    ).toBeInTheDocument();
  });

  it('should render question list items and highlight active item', async () => {
    await render(QuestionsOutline, {
      providers: [provideTranslateService()],
      componentProviders: [{ provide: CreateQuizStore, useValue: mockStore }],
    });

    expect(screen.getByText('First Question Title')).toBeInTheDocument();
    expect(screen.getByText('Second Question Title')).toBeInTheDocument();

    const activeItem = screen.getByRole('button', { name: /First Question Title/i });
    expect(activeItem).toHaveAttribute('aria-current', 'step');
  });

  it('should emit questionSelect output when an item is clicked', async () => {
    const questionSelectedSpy = vi.fn();

    await render(QuestionsOutline, {
      providers: [provideTranslateService()],
      componentProviders: [{ provide: CreateQuizStore, useValue: mockStore }],
      on: { questionSelected: questionSelectedSpy },
    });

    const user = userEvent.setup();
    const secondItem = screen.getByRole('button', { name: /Second Question Title/i });

    await user.click(secondItem);

    expect(questionSelectedSpy).toHaveBeenCalledWith('q-2');
  });
});
