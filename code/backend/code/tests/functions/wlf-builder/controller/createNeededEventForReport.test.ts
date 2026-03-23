import { Effect } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { WorkbookStep } from '@/lib/entities/wlf-builder/workbook';

jest.mock('@/lib/controllers/event-tracking', () => ({
  EventTrackingController: {
    addWlfBuilderEvent: jest.fn(),
  },
  MomEvents: {
    FirstModule: 'FirstModule',
    SecondModuleCompleted: 'SecondModuleCompleted',
    ThirdModuleCompleted: 'ThirdModuleCompleted',
  },
}));

import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { WlfBuilderEvents } from '@/lib/report/constants';

const mockedAddBuilderEvent = EventTrackingController.addWlfBuilderEvent as jest.Mock;

describe('createNeededEventForReport', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedAddBuilderEvent.mockResolvedValue(undefined);
  });

  it('emits FirstModule when step = FocusAreas', async () => {
    const data = { step: WorkbookStep.FocusAreas } as any;

    await Effect.runPromise(WlfBuilderController.createNeededEventForReport(data, pid));

    expect(mockedAddBuilderEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddBuilderEvent).toHaveBeenCalledWith(pid, WlfBuilderEvents.FirstModule);
  });

  it('emits SecondModuleCompleted when step = IntegritySustain', async () => {
    const data = { step: WorkbookStep.IntegritySustain } as any;

    await Effect.runPromise(WlfBuilderController.createNeededEventForReport(data, pid));

    expect(mockedAddBuilderEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddBuilderEvent).toHaveBeenCalledWith(pid, WlfBuilderEvents.SecondModuleCompleted);
  });

  it('emits ThirdModuleCompleted when step = Summary', async () => {
    const data = { step: WorkbookStep.Summary } as any;

    await Effect.runPromise(WlfBuilderController.createNeededEventForReport(data, pid));

    expect(mockedAddBuilderEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddBuilderEvent).toHaveBeenCalledWith(pid, WlfBuilderEvents.ThirdModuleCompleted);
  });

  it('does nothing (no event) for other steps', async () => {
    const data = { step: WorkbookStep.Overview } as any;

    await Effect.runPromise(WlfBuilderController.createNeededEventForReport(data, pid));

    expect(mockedAddBuilderEvent).not.toHaveBeenCalled();
  });
});
