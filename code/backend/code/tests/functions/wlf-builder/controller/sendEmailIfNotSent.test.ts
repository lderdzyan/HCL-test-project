import { Effect, Option as O } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { getWlfBuilderByPid, updateWlfBuilder } from '@/lib/entities/wlf-builder/answer';

jest.mock('@/lib/entities/wlf-builder/answer', () => ({
  getWlfBuilderByPid: jest.fn(),
  updateWlfBuilder: jest.fn(),
}));

const mockedGetByPid = getWlfBuilderByPid as jest.MockedFunction<typeof getWlfBuilderByPid>;
const mockedUpdateBuilder = updateWlfBuilder as jest.MockedFunction<typeof updateWlfBuilder>;
let sendEmailEffectSpy: jest.SpiedFunction<typeof WlfBuilderController.sendEmailEffect>;

describe('sendEmailIfNotSent', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
    sendEmailEffectSpy = jest.spyOn(WlfBuilderController, 'sendEmailEffect').mockReturnValue(Effect.succeed(undefined));
  });

  it('onNone: does nothing when no existing plan', async () => {
    mockedGetByPid.mockReturnValue(Effect.succeed(O.none()));

    const result = await Effect.runPromise(WlfBuilderController.sendEmailIfNotSent(pid));
    expect(result).toBeUndefined();

    expect(sendEmailEffectSpy).not.toHaveBeenCalled();
    expect(mockedUpdateBuilder).not.toHaveBeenCalled();
  });

  it('onSome + already sent: no email and no update', async () => {
    const existing = { id: 'ans-1', isEmailSent: true } as any;
    mockedGetByPid.mockReturnValue(Effect.succeed(O.some(existing)));

    const result = await Effect.runPromise(WlfBuilderController.sendEmailIfNotSent(pid));
    expect(result).toBeUndefined();

    expect(sendEmailEffectSpy).not.toHaveBeenCalled();
    expect(mockedUpdateBuilder).not.toHaveBeenCalled();
  });

  it('happy path: sends email, then updates isEmailSent=true, returns void', async () => {
    const existing = { id: 'ans-1', isEmailSent: false } as any;

    mockedGetByPid.mockReturnValue(Effect.succeed(O.some(existing)));
    sendEmailEffectSpy.mockReturnValue(Effect.succeed(undefined));
    mockedUpdateBuilder.mockReturnValue(Effect.succeed('updated-ok' as any));

    const result = await Effect.runPromise(WlfBuilderController.sendEmailIfNotSent(pid));
    expect(result).toBeUndefined();

    expect(sendEmailEffectSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailEffectSpy).toHaveBeenCalledWith(pid);

    // updateWlfBuilder is called with existing+flag, pid, and fields ['isEmailSent']
    expect(mockedUpdateBuilder).toHaveBeenCalledTimes(1);
    expect(mockedUpdateBuilder).toHaveBeenCalledWith({ ...existing, isEmailSent: true }, pid, ['isEmailSent']);
  });

  it('failure: when sendEmailEffect fails, propagate error and do NOT update', async () => {
    const existing = { id: 'ans-1', isEmailSent: false } as any;

    mockedGetByPid.mockReturnValue(Effect.succeed(O.some(existing)));
    sendEmailEffectSpy.mockReturnValue(Effect.fail(new Error('email-failed')) as any);

    await expect(Effect.runPromise(WlfBuilderController.sendEmailIfNotSent(pid))).rejects.toThrow('email-failed');

    expect(mockedUpdateBuilder).not.toHaveBeenCalled();
  });
});
