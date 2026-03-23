import { Effect } from 'effect';
import * as O from 'effect/Option';

import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { getIndicatorTrainingPlanByPid, TrainingPlanStep } from '@/lib/entities/wlf-indicator/training-plan';

jest.mock('@/lib/entities/wlf-indicator/training-plan', () => ({
  TrainingPlanStep: {
    Overview: 0,
    ChooseTargetAreas: 1,
    CompletePlan: 2,
    Summary: 3,
  },
  getIndicatorTrainingPlanByPid: jest.fn(),
}));

describe('getIndicatorTrainingPlanByPid', () => {
  const pid = 'pid-123';
  const mockGetByPid = getIndicatorTrainingPlanByPid as jest.MockedFunction<typeof getIndicatorTrainingPlanByPid>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns Some(id) when training plan exists and step is not Summary', async () => {
    const plan = { id: 'plan-1', step: TrainingPlanStep.ChooseTargetAreas } as any;
    mockGetByPid.mockReturnValue(Effect.succeed(O.some(plan)));

    const result = await Effect.runPromise(IndicatorController.getPendingIndicatorTrainingPlan(pid));

    expect(mockGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isSome(result)).toBe(true);
    expect(result).toEqual(O.some('plan-1'));
  });

  it('returns None when training plan exists but step = Summary', async () => {
    const plan = { id: 'plan-2', step: TrainingPlanStep.Summary } as any;
    mockGetByPid.mockReturnValue(Effect.succeed(O.some(plan)));

    const result = await Effect.runPromise(IndicatorController.getPendingIndicatorTrainingPlan(pid));

    expect(mockGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isNone(result)).toBe(true);
  });

  it('returns None when no training plan exists', async () => {
    mockGetByPid.mockReturnValue(Effect.succeed(O.none()));

    const result = await Effect.runPromise(IndicatorController.getPendingIndicatorTrainingPlan(pid));

    expect(mockGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isNone(result)).toBe(true);
  });

  it('propagates failure if getWFSTrainingPlanByPid fails', async () => {
    const boom = new Error('fetch failed');
    mockGetByPid.mockReturnValue(Effect.fail(boom));

    await expect(Effect.runPromise(IndicatorController.getPendingIndicatorTrainingPlan(pid))).rejects.toThrow(
      'fetch failed',
    );
  });
});
