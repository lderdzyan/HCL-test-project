import { Effect } from 'effect';
import * as O from 'effect/Option';

import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { getIndicatorTrainingPlanByPid } from '@/lib/entities/wlf-indicator/training-plan';

jest.mock('@/lib/entities/wlf-indicator/training-plan', () => ({
  getIndicatorTrainingPlanByPid: jest.fn(),
}));

describe('getTrainingPlan', () => {
  const pid = 'pid-123';
  const mockGetByPid = getIndicatorTrainingPlanByPid as jest.MockedFunction<typeof getIndicatorTrainingPlanByPid>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the plan when found (O.some)', async () => {
    const plan = { step: 0, foo: 'bar' } as any;
    mockGetByPid.mockReturnValue(Effect.succeed(O.some(plan)));

    const result = await Effect.runPromise(IndicatorController.getTrainingPlan(pid));

    expect(mockGetByPid).toHaveBeenCalledWith(pid);
    expect(result).toEqual(plan);
  });

  it('returns null when not found (O.none)', async () => {
    mockGetByPid.mockReturnValue(Effect.succeed(O.none()));

    const result = await Effect.runPromise(IndicatorController.getTrainingPlan(pid));

    expect(mockGetByPid).toHaveBeenCalledWith(pid);
    expect(result).toBeNull();
  });

  it('propagates failure from getIndicatorTrainingPlanByPid', async () => {
    const boom = new Error('db-down');
    mockGetByPid.mockReturnValue(Effect.fail(boom));

    await expect(Effect.runPromise(IndicatorController.getTrainingPlan(pid))).rejects.toThrow('db-down');
  });
});
