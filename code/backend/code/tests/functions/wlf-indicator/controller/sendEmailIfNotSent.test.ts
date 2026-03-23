import { Effect } from 'effect';
import * as O from 'effect/Option';
import { getIndicatorByPid, updateIndicator } from '@/lib/entities/wlf-indicator/answer';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';

jest.mock('@/lib/entities/wlf-indicator/answer', () => ({
  getIndicatorByPid: jest.fn(),
  updateIndicator: jest.fn(),
}));

const getWFStatementsByPersonId = getIndicatorByPid as jest.Mock;
const updateFulfillment = updateIndicator as jest.Mock;

describe('sendEmailIfNotSent', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does nothing when there is no existing plan (O.none)', async () => {
    getWFStatementsByPersonId.mockReturnValue(Effect.succeed(O.none()));

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await Effect.runPromise(IndicatorController.sendEmailIfNotSent(pid) as Effect.Effect<unknown, Error, never>);

    expect(emailSender).not.toHaveBeenCalled();
    expect(updateFulfillment).not.toHaveBeenCalled();
  });

  it('does nothing when isEmailSent is already true', async () => {
    getWFStatementsByPersonId.mockReturnValue(Effect.succeed(O.some({ isEmailSent: true })));

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await Effect.runPromise(IndicatorController.sendEmailIfNotSent(pid) as Effect.Effect<unknown, Error, never>);

    expect(emailSender).not.toHaveBeenCalled();
    expect(updateFulfillment).not.toHaveBeenCalled();
  });

  it('sends email and marks isEmailSent=true when not yet sent', async () => {
    const existingPlan = { isEmailSent: false, some: 'field' };
    getWFStatementsByPersonId.mockReturnValue(Effect.succeed(O.some(existingPlan)));

    const emailSender = jest.fn(() => Effect.succeed<void>(undefined));
    IndicatorController.__setEmailSenderForTests(emailSender);

    updateFulfillment.mockReturnValue(Effect.succeed(undefined));

    await Effect.runPromise(IndicatorController.sendEmailIfNotSent(pid) as Effect.Effect<unknown, Error, never>);

    expect(emailSender).toHaveBeenCalledTimes(1);
    expect(emailSender).toHaveBeenCalledWith(pid);

    expect(updateFulfillment).toHaveBeenCalledTimes(1);
    expect(updateFulfillment).toHaveBeenCalledWith({ ...existingPlan, isEmailSent: true }, pid, ['isEmailSent']);
  });

  it('propagates failure if email sending fails and does not call update', async () => {
    const existingPlan = { isEmailSent: false };
    getWFStatementsByPersonId.mockReturnValue(Effect.succeed(O.some(existingPlan)));

    const emailSender = jest.fn(() => Effect.fail(new Error('email-fail') as any));
    IndicatorController.__setEmailSenderForTests(emailSender);

    await expect(
      Effect.runPromise(IndicatorController.sendEmailIfNotSent(pid) as Effect.Effect<unknown, Error, never>),
    ).rejects.toThrow();

    expect(updateFulfillment).not.toHaveBeenCalled();
  });
});
