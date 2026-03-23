import { SurveyAnswerProcessStatus } from '@/lib/constants';
import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { updateIndicator } from '@/lib/entities/wlf-indicator/answer';
import { WlfEvents } from '@/lib/report/constants';
import { Effect } from 'effect/index';

jest.mock('@/lib/entities/wlf-indicator/answer', () => ({
  updateIndicator: jest.fn(),
}));

jest.mock('@/lib/controllers/event-tracking', () => ({
  EventTrackingController: { addIndicatorEvent: jest.fn() },
}));

describe('processAndUpdate', () => {
  const pid = 'pid-123';

  const baseWf = {
    id: 'wlf-1',
    answers: JSON.stringify({ foo: 1 }),
  } as any;

  const fakeExtra = {
    growthOpportunities: [],
    aligned: [],
    hiddenStrengths: [],
  };

  const mockedUpdate = updateIndicator as jest.Mock;
  const mockedAddEvent = EventTrackingController.addIndicatorEvent as jest.Mock;

  let processResultsSpy: jest.SpyInstance;
  let processTaxamoSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.resetAllMocks();

    processResultsSpy = jest.spyOn(IndicatorController.exportedForTesting, 'processResults').mockReturnValue(fakeExtra);

    processTaxamoSpy = jest
      .spyOn(IndicatorController, 'processTaxamoWebhook')
      .mockReturnValue(Effect.succeed(undefined) as any);

    mockedAddEvent.mockResolvedValue(undefined);
  });

  it('happy path: processes results, updates WLF, triggers taxamo and event tracking (in order)', async () => {
    const expectedUpdated = {
      ...baseWf,
      processResult: JSON.stringify(fakeExtra),
      status: SurveyAnswerProcessStatus.Finished,
    };

    mockedUpdate.mockReturnValueOnce(Effect.succeed(expectedUpdated));

    await Effect.runPromise(IndicatorController.processAndUpdate(baseWf, pid));

    // 1) processResults called with the incoming wf
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    const firstArg = (mockedUpdate.mock.calls[0] as any[])[0];
    expect(firstArg).toMatchObject({
      status: SurveyAnswerProcessStatus.Finished,
    });
    expect(() => JSON.parse(firstArg.processResult)).not.toThrow();

    // 2) updateWlf receives merged payload + allowed fields list
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).toHaveBeenCalledWith(expectedUpdated, pid, ['completedAt', 'processResult', 'status']);

    // 3) processTaxamoWebhook and event tracking are called
    expect(processTaxamoSpy).toHaveBeenCalledTimes(1);
    expect(processTaxamoSpy).toHaveBeenCalledWith(pid);

    expect(mockedAddEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddEvent).toHaveBeenCalledWith(pid, WlfEvents.Completed);

    // 4) Ensure call order: update → taxamo → event
    const orderUpdate = (mockedUpdate.mock as any).invocationCallOrder[0];
    const orderTaxamo = (processTaxamoSpy.mock as any).invocationCallOrder[0];
    const orderEvent = (mockedAddEvent.mock as any).invocationCallOrder[0];

    expect(orderUpdate).toBeLessThan(orderTaxamo);
    expect(orderTaxamo).toBeLessThan(orderEvent);
  });

  it('propagates failure if updateWlf fails, and does not call taxamo or event', async () => {
    mockedUpdate.mockReturnValueOnce(Effect.fail(new Error('update-fail')));

    await expect(Effect.runPromise(IndicatorController.processAndUpdate(baseWf, pid))).rejects.toThrow('update-fail');

    expect(processTaxamoSpy).not.toHaveBeenCalled();
    expect(mockedAddEvent).not.toHaveBeenCalled();
  });

  it('propagates failure if processTaxamoWebhook fails, and does not call event tracking afterwards', async () => {
    const expectedUpdated = {
      ...baseWf,
      processResult: JSON.stringify(fakeExtra),
      status: SurveyAnswerProcessStatus.Finished,
    };

    mockedUpdate.mockReturnValueOnce(Effect.succeed(expectedUpdated));
    processTaxamoSpy.mockReturnValueOnce(Effect.fail(new Error('taxamo-fail')));

    await expect(Effect.runPromise(IndicatorController.processAndUpdate(baseWf, pid))).rejects.toThrow('taxamo-fail');

    // event tracking should not run if the prior tap failed
    expect(mockedAddEvent).not.toHaveBeenCalled();
  });

  it('awaits event tracking (wrapped via Effect.promise) and surfaces its error', async () => {
    const expectedUpdated = {
      ...baseWf,
      processResult: JSON.stringify(fakeExtra),
      status: SurveyAnswerProcessStatus.Finished,
    };

    mockedUpdate.mockReturnValueOnce(Effect.succeed(expectedUpdated));
    processTaxamoSpy.mockReturnValueOnce(Effect.succeed(undefined));
    mockedAddEvent.mockRejectedValueOnce(new Error('event-fail'));

    await expect(Effect.runPromise(IndicatorController.processAndUpdate(baseWf, pid))).rejects.toThrow('event-fail');

    expect(mockedAddEvent).toHaveBeenCalledWith(pid, WlfEvents.Completed);
  });
});
