import { Effect } from 'effect';
import * as O from 'effect/Option';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';

import * as AnswerModule from '@/lib/entities/wlf-indicator/answer';

import * as TrainingPlanModule from '@/lib/entities/wlf-indicator/training-plan';

jest.mock('@/lib/entities/wlf-indicator/answer', () => ({
  getIndicatorByPid: jest.fn(),
  updateIndicator: jest.fn(),
}));

const mockedGetWF = AnswerModule.getIndicatorByPid as jest.MockedFunction<typeof AnswerModule.getIndicatorByPid>;
const mockedUpdate = AnswerModule.updateIndicator as jest.MockedFunction<typeof AnswerModule.updateIndicator>;

type CreatePlanReturn = ReturnType<typeof TrainingPlanModule.createIndicatorTrainingPlan>;

describe('processTaxamoWebhook', () => {
  const pid = 'pid-123';
  const baseWlf = { answers: JSON.stringify({ a: 1 }), surveyId: 's-1' };

  let createPlanSpy: jest.SpiedFunction<typeof TrainingPlanModule.createIndicatorTrainingPlan>;

  beforeEach(() => {
    jest.clearAllMocks();

    createPlanSpy = jest.spyOn(TrainingPlanModule, 'createIndicatorTrainingPlan');

    IndicatorController.__setEmailSenderForTests(() => Effect.succeed<void>(undefined) as any);
  });

  it('fails when no WLF exists (O.none)', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.none()));

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await expect(IndicatorController.processTaxamoWebhook(pid)).rejects.toThrow('No existing Indicator');

    expect(mockedGetWF).toHaveBeenCalledWith(pid);
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(createPlanSpy).not.toHaveBeenCalled();
    expect(emailSender).not.toHaveBeenCalled();
  });

  it('happy path: updates status → emails → creates training plan', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.some(baseWlf)));
    mockedUpdate.mockReturnValueOnce(Effect.succeed('UPDATED'));
    createPlanSpy.mockReturnValueOnce(Effect.succeed('CREATED') as unknown as CreatePlanReturn);

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await expect(IndicatorController.processTaxamoWebhook(pid)).resolves.toBeUndefined();

    expect(mockedGetWF).toHaveBeenCalledWith(pid);
    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(createPlanSpy).toHaveBeenCalledTimes(1);
    expect(emailSender).toHaveBeenCalledTimes(1);
    expect(emailSender).toHaveBeenCalledWith(pid);
  });

  it('propagates failure if updateWlf fails (do not call create training plan)', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.some(baseWlf)));
    mockedUpdate.mockReturnValueOnce(Effect.fail(new Error('update-fail')));

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await expect(IndicatorController.processTaxamoWebhook(pid)).rejects.toThrow('update-fail');

    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(createPlanSpy).not.toHaveBeenCalled();
    expect(emailSender).not.toHaveBeenCalled();
  });

  it('propagates failure if createIndicatorTrainingPlan fails (after update + email)', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.some(baseWlf)));
    mockedUpdate.mockReturnValueOnce(Effect.succeed('UPDATED'));
    createPlanSpy.mockReturnValueOnce(Effect.fail(new Error('plan-fail')) as unknown as CreatePlanReturn);

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await expect(IndicatorController.processTaxamoWebhook(pid)).rejects.toThrow('plan-fail');

    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(createPlanSpy).toHaveBeenCalledTimes(1);
    expect(emailSender).toHaveBeenCalledTimes(1);
    expect(emailSender).toHaveBeenCalledWith(pid);
  });
});
