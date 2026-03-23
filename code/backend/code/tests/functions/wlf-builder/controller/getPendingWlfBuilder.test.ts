import { Effect, Option as O } from 'effect';
import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { getWlfBuilderByPid } from '@/lib/entities/wlf-builder/answer';
import { SurveyAnswerProcessStatus } from '@/lib/constants';

jest.mock('@/lib/entities/wlf-builder/answer', () => ({
  getWlfBuilderByPid: jest.fn(),
}));

const mockedGetByPid = getWlfBuilderByPid as jest.MockedFunction<typeof getWlfBuilderByPid>;

describe('getPendingWlfBuilder', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([SurveyAnswerProcessStatus.InProgress, SurveyAnswerProcessStatus.Finished])(
    'returns O.some(id) when status = %s',
    async (status) => {
      const mom = { id: 'mom-1', status } as any;

      mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(mom)));

      const result = await Effect.runPromise(WlfBuilderController.getPendingWlfBuilder(pid));

      expect(mockedGetByPid).toHaveBeenCalledWith(pid);
      expect(O.isSome(result)).toBe(true);
      expect(O.getOrUndefined(result)).toBe('mom-1');
    },
  );

  it('returns O.none when status is not InProgress or Finished', async () => {
    const mom = { id: 'mom-2', status: SurveyAnswerProcessStatus.Done } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(mom)));

    const result = await Effect.runPromise(WlfBuilderController.getPendingWlfBuilder(pid));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isNone(result)).toBe(true);
  });

  it('returns O.none when no WlfBuilder found (O.none)', async () => {
    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.none()));

    const result = await Effect.runPromise(WlfBuilderController.getPendingWlfBuilder(pid));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isNone(result)).toBe(true);
  });

  it('propagates failures from getWlfBuilderFoundationsByPid', async () => {
    const err = new Error('fetch failed');
    mockedGetByPid.mockReturnValueOnce(Effect.fail(err));

    await expect(Effect.runPromise(WlfBuilderController.getPendingWlfBuilder(pid))).rejects.toThrow('fetch failed');
    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
  });
});
