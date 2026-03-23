import { Effect } from 'effect';
import * as O from 'effect/Option';

import { getWlfBuilderByPid } from '@/lib/entities/wlf-builder/answer';
import { WlfBuilderController } from '@/lib/controllers/wlf-builder';

jest.mock('@/lib/entities/wlf-builder/answer', () => {
  const actual = jest.requireActual('@/lib/entities/wlf-builder/answer');
  return {
    ...actual,
    getWlfBuilderByPid: jest.fn(),
  };
});

type WlfBuilderFoundationsAnswer = {
  answers: string;
  surveyId: string;
};

const mockedGetByPid = getWlfBuilderByPid as jest.MockedFunction<typeof getWlfBuilderByPid>;

describe('getWlfBuilderFoundationsAnwer', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Some(data) when getWlfBuilderFoundationsByPid yields Some', async () => {
    const sample: WlfBuilderFoundationsAnswer = {
      answers: '{"q1":"a1"}',
      surveyId: 's-1',
    };

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(sample)) as any);

    const out = await Effect.runPromise(WlfBuilderController.getWlfBuilderAnwer(pid));

    expect(mockedGetByPid).toHaveBeenCalledTimes(1);
    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isSome(out)).toBe(true);
    expect(out._tag).toBe('Some');
    // @ts-expect-error - narrow for test
    expect(out.value).toEqual(sample);
  });

  it('returns None when getWlfBuilderFoundationsByPid yields None', async () => {
    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.none()));

    const out = await Effect.runPromise(WlfBuilderController.getWlfBuilderAnwer(pid));

    expect(mockedGetByPid).toHaveBeenCalledTimes(1);
    expect(O.isNone(out)).toBe(true);
  });

  it('propagates failure when getWlfBuilderFoundationsByPid fails', async () => {
    mockedGetByPid.mockReturnValueOnce(Effect.fail(new Error('db-down')));

    await expect(Effect.runPromise(WlfBuilderController.getWlfBuilderAnwer(pid))).rejects.toThrow('db-down');
    expect(mockedGetByPid).toHaveBeenCalledTimes(1);
  });
});
