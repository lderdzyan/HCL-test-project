// getPending.spec.ts
import { Effect, Option as O } from 'effect';
import { getIndicatorByPid } from '@/lib/entities/wlf-indicator/answer';
import { IndicatorController } from '@/lib/controllers/wlf-indicator';
import { SurveyAnswerProcessStatus } from '@/lib/constants';

jest.mock('@/lib/entities/wlf-indicator/answer', () => ({
  getIndicatorByPid: jest.fn(),
}));

const mockedGetByPid = getIndicatorByPid as jest.MockedFunction<typeof getIndicatorByPid>;

describe('getPending', () => {
  const pid = 'person-123';

  it('returns O.none when no record exists', async () => {
    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.none()));

    const result = await Effect.runPromise(getIndicatorByPid(pid));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(O.isNone(result)).toBe(true);
  });

  it('returns O.some(id) when status is InProgress', async () => {
    mockedGetByPid.mockReturnValueOnce(
      Effect.succeed(O.some({ id: 'wlf-1', status: SurveyAnswerProcessStatus.InProgress } as any)),
    );

    const result = await Effect.runPromise(IndicatorController.getPendingIndicator(pid));

    expect(O.isSome(result)).toBe(true);
    expect(O.getOrNull(result)).toBe('wlf-1');
  });

  it('returns O.some(id) when status is Finished', async () => {
    mockedGetByPid.mockReturnValueOnce(
      Effect.succeed(O.some({ id: 'wlf-2', status: SurveyAnswerProcessStatus.Finished } as any)),
    );

    const result = await Effect.runPromise(IndicatorController.getPendingIndicator(pid));

    expect(O.isSome(result)).toBe(true);
    expect(O.getOrNull(result)).toBe('wlf-2');
  });

  it('returns O.none for any other status (e.g., Done)', async () => {
    mockedGetByPid.mockReturnValueOnce(
      Effect.succeed(O.some({ id: 'wlf-3', status: SurveyAnswerProcessStatus.Done } as any)),
    );

    const result = await Effect.runPromise(IndicatorController.getPendingIndicator(pid));

    expect(O.isNone(result)).toBe(true);
  });
});
