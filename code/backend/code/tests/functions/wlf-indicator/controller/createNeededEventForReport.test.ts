import { Effect } from 'effect';

import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { TrainingPlanStep } from '@/lib/entities/wlf-indicator/training-plan';
import { WlfEvents } from '@/lib/report/constants';

jest.mock('@/lib/controllers/event-tracking', () => ({
  EventTrackingController: {
    addIndicatorEvent: jest.fn(),
  },
}));

describe('createNeededEventForReport', () => {
  const pid = 'pid-123';

  const mockedAddWLFEvent = EventTrackingController.addIndicatorEvent as jest.MockedFunction<
    typeof EventTrackingController.addIndicatorEvent
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    mockedAddWLFEvent.mockResolvedValue(undefined);
  });

  it.each([
    {
      step: TrainingPlanStep.ChooseTargetAreas,
      expectedEvent: WlfEvents.WarmUpCompleted,
      label: 'ChooseTargetAreas → WarmUpCompleted',
    },
    {
      step: TrainingPlanStep.CompletePlan,
      expectedEvent: WlfEvents.TargetAreaCompleted,
      label: 'CompletePlan → TargetAreaCompleted',
    },
    {
      step: TrainingPlanStep.Summary,
      expectedEvent: WlfEvents.TrainingPlanCompleted,
      label: 'Summary → TrainingPlanCompleted',
    },
  ])('emits correct event: %s', async ({ step, expectedEvent, label }) => {
    const data = { step } as any;

    await Effect.runPromise(IndicatorController.exportedForTesting.createNeededEventForReport(data, pid));

    expect(mockedAddWLFEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddWLFEvent).toHaveBeenCalledWith(pid, expectedEvent);
  });

  it('does nothing (returns succeed(undefined)) for steps not listed in the switch', async () => {
    const data = { step: (TrainingPlanStep as any).Overview ?? 9999 } as any;

    await Effect.runPromise(IndicatorController.exportedForTesting.createNeededEventForReport(data, pid));

    expect(mockedAddWLFEvent).not.toHaveBeenCalled();
  });
});
