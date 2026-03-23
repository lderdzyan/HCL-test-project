import { Effect } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { createWlfBuilder } from '@/lib/entities/wlf-builder/answer';
import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { WlfBuilderEvents } from '@/lib/report/constants';

type Payment = { surveyId?: string; personId?: string };

jest.mock('@/lib/entities/wlf-builder/answer', () => ({
  createWlfBuilder: jest.fn(),
}));

jest.mock('@/lib/controllers/event-tracking', () => ({
  EventTrackingController: { addWlfBuilderEvent: jest.fn() },
}));

const mockedCreateWlfBuilder = createWlfBuilder as jest.Mock;
const mockedAddBuilderEvent = EventTrackingController.addWlfBuilderEvent as jest.Mock;
let sendEmailEffectSpy: jest.SpiedFunction<typeof WlfBuilderController.sendEmailEffect>;

describe('processTaxamoWebhook', () => {
  const payment: Payment = { surveyId: 'survey-1', personId: 'pid-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    sendEmailEffectSpy = jest.spyOn(WlfBuilderController, 'sendEmailEffect').mockReturnValue(Effect.succeed(undefined));
  });

  it('happy path: creates WlfBuilder, sends email, and tracks event', async () => {
    mockedCreateWlfBuilder.mockReturnValueOnce(Effect.succeed('ok'));
    sendEmailEffectSpy.mockReturnValueOnce(Effect.succeed<void>(undefined));
    mockedAddBuilderEvent.mockResolvedValueOnce(undefined);

    await expect(WlfBuilderController.processTaxamoWebhook(payment as any)).resolves.toBeUndefined();

    expect(mockedCreateWlfBuilder).toHaveBeenCalledTimes(1);
    expect(mockedCreateWlfBuilder).toHaveBeenCalledWith('survey-1', 'pid-123');

    expect(sendEmailEffectSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailEffectSpy).toHaveBeenCalledWith('pid-123');

    expect(mockedAddBuilderEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddBuilderEvent).toHaveBeenCalledWith('pid-123', WlfBuilderEvents.PurchaseDate);
  });

  it('failure: propagates error if createWlfBuilder fails and does NOT create events and send email', async () => {
    mockedCreateWlfBuilder.mockReturnValueOnce(Effect.fail(new Error('create-fail')));

    await expect(WlfBuilderController.processTaxamoWebhook(payment as any)).rejects.toThrow('create-fail');

    expect(sendEmailEffectSpy).not.toHaveBeenCalled();
    expect(mockedAddBuilderEvent).not.toHaveBeenCalled();
  });
});
