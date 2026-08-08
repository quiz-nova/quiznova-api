import { TRANSLATION_TOKENS } from '@Core/config/language.config';
import { AuthService } from '@Features/auth/auth.service';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CoursesService } from '@shared/services/courses.service';
import { QuizService } from '@shared/services/quiz.service';

import { CreateQuiz } from './create-quiz';

describe('CreateQuiz Container Component', () => {
  const tokens = TRANSLATION_TOKENS;
  const mockAuthService = {
    currentUser: vi.fn().mockReturnValue({ id: 'inst-1', role: 'Instructor' }),
  };

  const mockCoursesService = {
    getInstructorCourses: vi.fn().mockReturnValue(of([])),
    getCourseById: vi.fn().mockReturnValue(of({ remainingMarks: 20 })),
  };

  const mockQuizService = {
    createQuiz: vi.fn().mockReturnValue(of({})),
  };

  const mockMessageService = {
    add: vi.fn(),
  };

  it('should render page title, publish panel, and empty questions prompt initially', async () => {
    await render(CreateQuiz, {
      providers: [
        provideTranslateService(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: QuizService, useValue: mockQuizService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    });

    expect(screen.getByText(tokens.INSTRUCTOR.CREATE_QUIZ_TITLE)).toBeInTheDocument();
    expect(screen.getByText(tokens.INSTRUCTOR.CREATE_QUIZ_DESC)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Quiz/i })).toBeDisabled();
  });
});
