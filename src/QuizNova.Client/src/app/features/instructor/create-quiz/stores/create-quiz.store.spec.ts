import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';
import { vi } from 'vitest';

import { Question, QuestionType } from '@shared/models/quiz/question.model';
import { CoursesService } from '@shared/services/courses.service';
import { QuizService } from '@shared/services/quiz.service';

import { CreateQuizStore } from './create-quiz.store';

describe('CreateQuizStore', () => {
  let store: InstanceType<typeof CreateQuizStore>;
  let coursesServiceMock: any;
  let quizServiceMock: any;

  beforeEach(() => {
    coursesServiceMock = {
      getCourseById: vi.fn().mockReturnValue(of({ id: 'course-123', remainingMarks: 15 })),
    };

    quizServiceMock = {
      createQuiz: vi.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateQuizStore,
        { provide: CoursesService, useValue: coursesServiceMock },
        { provide: QuizService, useValue: quizServiceMock },
      ],
    });

    store = TestBed.inject(CreateQuizStore);
  });

  it('should set header metadata', () => {
    const payload = {
      title: 'New Quiz',
      courseId: 'c-1',
      startsAtUtc: new Date('2026-07-13T12:00:00Z'),
      endsAtUtc: new Date('2026-07-13T13:00:00Z'),
    };

    store.setHeaderMetadata(payload);

    expect(store.quiz().title).toBe('New Quiz');
    expect(store.quiz().courseId).toBe('c-1');
  });

  it('should fetch course details and set remainingMarks when courseId is updated', () => {
    store.updateCourseId('course-123');

    expect(coursesServiceMock.getCourseById).toHaveBeenCalledWith('course-123');
    expect(store.remainingMarks()).toBe(15);
  });

  it('should compute totalMarks and remainingMarks when questions change', () => {
    store.updateCourseId('course-123');

    const q1 = { id: 'q-1', marks: 5, type: QuestionType.Mcq } as Question;
    store.addQuestion(q1);

    expect(store.totalMarks()).toBe(5);
    expect(store.effectiveRemainingMarks()).toBe(10);

    const q2 = { id: 'q-2', marks: 4, type: QuestionType.Essay } as Question;
    store.addQuestion(q2);

    expect(store.totalMarks()).toBe(9);
    expect(store.effectiveRemainingMarks()).toBe(6);
  });

  it('should prevent updating marks if it exceeds the effective remaining course marks', () => {
    store.updateCourseId('course-123');

    const q1 = { id: 'q-1', marks: 5, type: QuestionType.Mcq } as Question;
    store.addQuestion(q1);

    store.updateQuestionMarks('q-1', 20);
    expect(store.quiz().questions[0].marks).toBe(5);
  });

  it('should remove questions and update activeQuestionId', () => {
    const q1 = { id: 'q-1', marks: 3, type: QuestionType.Mcq } as Question;
    const q2 = { id: 'q-2', marks: 2, type: QuestionType.Essay } as Question;

    store.addQuestion(q1);
    store.addQuestion(q2);

    expect(store.activeQuestionId()).toBe('q-2');

    store.removeQuestion('q-2');

    expect(store.quiz().questions.length).toBe(1);
    expect(store.quiz().questions[0].id).toBe('q-1');
    expect(store.activeQuestionId()).toBe('q-1');
  });
});
