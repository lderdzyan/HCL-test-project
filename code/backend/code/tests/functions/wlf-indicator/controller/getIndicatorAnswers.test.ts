import { getIndicatorByPid, IndicatorAnswer } from '@/lib/entities/wlf-indicator/answer';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { Effect } from 'effect';
import * as O from 'effect/Option';

jest.mock('@/lib/entities/wlf-indicator/answer', () => ({
  getIndicatorByPid: jest.fn(),
}));

const mockedGetWF = getIndicatorByPid as jest.MockedFunction<typeof getIndicatorByPid>;

describe('getIndicatorAnswers', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getIndicatorByPid with the pid', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.none()));

    await Effect.runPromise(IndicatorController.getInidicatorAnswers(pid));

    expect(mockedGetWF).toHaveBeenCalledTimes(1);
    expect(mockedGetWF).toHaveBeenCalledWith(pid);
  });

  it('returns Some(answer) when the underlying effect resolves with Some', async () => {
    const fake: IndicatorAnswer = {
      answers: JSON.stringify({ a: 1 }),
      surveyId: 's-1',
      completedAt: 1710000000,
    };

    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.some(fake)));

    const out = await Effect.runPromise(IndicatorController.getInidicatorAnswers(pid));

    expect(O.isSome(out)).toBe(true);
    expect((out as O.Some<IndicatorAnswer>).value).toEqual(fake);
  });

  it('returns None when the underlying effect resolves with None', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.succeed(O.none()));

    const out = await Effect.runPromise(IndicatorController.getInidicatorAnswers(pid));

    expect(O.isNone(out)).toBe(true);
  });

  it('fails when the underlying effect fails', async () => {
    mockedGetWF.mockReturnValueOnce(Effect.fail(new Error('boom')));

    await expect(Effect.runPromise(IndicatorController.getInidicatorAnswers(pid))).rejects.toThrow('boom');
  });
});
