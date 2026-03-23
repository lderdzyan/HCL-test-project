import { Effect } from 'effect';
import * as O from 'effect/Option';

import {
  getIndicatorTrainingPlanByPid,
  createIndicatorTrainingPlan,
  updateIndicatorTrainingPlan,
  TrainingPlanStep,
} from '@/lib/entities/wlf-indicator/training-plan';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { deepMerge } from '@/lib/utils/array-utils';
import { WlfEvents } from '@/lib/report/constants';

jest.mock('@/lib/report/constants', () => ({
  WlfEvents: {
    WarmUpCompleted: 'WarmUpCompleted',
    TargetAreaCompleted: 'TargetAreaCompleted',
    TrainingPlanCompleted: 'TrainingPlanCompleted',
  },
}));

jest.mock('@/lib/entities/wlf-indicator/training-plan', () => ({
  TrainingPlanStep: {
    Overview: 0,
    ChooseTargetAreas: 1,
    CompletePlan: 2,
    Summary: 3,
  },
  getIndicatorTrainingPlanByPid: jest.fn(),
  createIndicatorTrainingPlan: jest.fn(),
  updateIndicatorTrainingPlan: jest.fn(),
}));

jest.mock('@/lib/utils/array-utils', () => ({
  deepMerge: jest.fn(),
}));

jest.mock('@/lib/controllers/event-tracking', () => ({
  EventTrackingController: {
    addIndicatorEvent: jest.fn(),
  },
}));

describe('setTrainingPlanAnswersAndStep', () => {
  const pid = 'pid-123';

  const mockGetByPid = getIndicatorTrainingPlanByPid as jest.MockedFunction<typeof getIndicatorTrainingPlanByPid>;
  const mockCreate = createIndicatorTrainingPlan as jest.MockedFunction<typeof createIndicatorTrainingPlan>;
  const mockUpdate = updateIndicatorTrainingPlan as jest.MockedFunction<typeof updateIndicatorTrainingPlan>;
  const mockDeepMerge = deepMerge as jest.MockedFunction<typeof deepMerge>;
  const mockAddEvent = EventTrackingController.addIndicatorEvent as jest.MockedFunction<
    typeof EventTrackingController.addIndicatorEvent
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    mockCreate.mockReturnValue(Effect.succeed(undefined) as any);
    mockUpdate.mockReturnValue(Effect.succeed(undefined) as any);
    mockAddEvent.mockResolvedValue(undefined);
  });

  it('onNone: creates plan with step=Overview and does NOT send any event', async () => {
    mockGetByPid.mockReturnValue(Effect.succeed(O.none()));
    const inputData = { step: TrainingPlanStep.Summary, anyField: 1 } as any;

    await Effect.runPromise(IndicatorController.setTrainingPlanAnswersAndStep(pid, inputData));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0]).toEqual({ ...inputData, step: TrainingPlanStep.Overview });
    expect(mockCreate.mock.calls[0][1]).toBe(pid);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAddEvent).not.toHaveBeenCalled();
  });

  it('onSome: updates with deepMerge and sends the right event for the input step', async () => {
    const existing = { step: TrainingPlanStep.Overview, foo: 1 } as any;
    mockGetByPid.mockReturnValue(Effect.succeed(O.some(existing)));

    const inputData = { step: TrainingPlanStep.Summary, bar: 2 } as any;
    mockDeepMerge.mockReturnValue({ merged: true } as any);

    await Effect.runPromise(IndicatorController.setTrainingPlanAnswersAndStep(pid, inputData));

    expect(mockDeepMerge).toHaveBeenCalledWith(existing, inputData);
    expect(mockUpdate).toHaveBeenCalledWith({ merged: true }, pid, Object.keys(inputData));
    expect(mockAddEvent).toHaveBeenCalledTimes(1);
    expect(mockAddEvent).toHaveBeenCalledWith(pid, WlfEvents.TrainingPlanCompleted);
  });

  it('propagates update failure and does NOT send event', async () => {
    mockGetByPid.mockReturnValue(Effect.succeed(O.some({ step: TrainingPlanStep.Overview } as any)));
    mockDeepMerge.mockReturnValue({} as any);
    mockUpdate.mockReturnValue(Effect.fail(new Error('update-failed')));

    await expect(
      Effect.runPromise(
        IndicatorController.setTrainingPlanAnswersAndStep(pid, {
          step: TrainingPlanStep.CompletePlan,
        } as any),
      ),
    ).rejects.toThrow('update-failed');

    expect(mockAddEvent).not.toHaveBeenCalled();
  });
});
