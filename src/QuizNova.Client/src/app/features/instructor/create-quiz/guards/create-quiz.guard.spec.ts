import { describe, expect, it, vi } from 'vitest';

import { CreateQuiz } from '../create-quiz';
import { canDeactivateCreateQuiz } from './create-quiz.guard';

describe('canDeactivateCreateQuiz Guard', () => {
  it('should call component.canDeactivate() if implemented', async () => {
    const mockComponent = {
      canDeactivate: vi.fn().mockReturnValue(Promise.resolve(false)),
    } as unknown as CreateQuiz;

    const result = canDeactivateCreateQuiz(mockComponent, null as any, null as any, null as any);
    expect(mockComponent.canDeactivate).toHaveBeenCalled();
    await expect(result).resolves.toBe(false);
  });

  it('should return true if component.canDeactivate is not defined', () => {
    const mockComponent = {} as unknown as CreateQuiz;

    const result = canDeactivateCreateQuiz(mockComponent, null as any, null as any, null as any);
    expect(result).toBe(true);
  });
});
