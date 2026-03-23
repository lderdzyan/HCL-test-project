import { Effect } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { SurveyAnswerProcessStatus } from '@/lib/constants';

import { publishMessage } from '@/lib/publish-message';
import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { updateWlfBuilder } from '@/lib/entities/wlf-builder/answer';
import { currentAt } from '@/lib/entity';
import { respond } from '@/lib/request';
import { SurveyType } from '@/lib/entities/survey';
import { WlfBuilderEvents } from '@/lib/report/constants';

jest.mock('@/lib/publish-message', () => ({
  publishMessage: jest.fn(),
}));

jest.mock('@/lib/controllers/event-tracking', () => ({
  EventTrackingController: {
    addWlfBuilderEvent: jest.fn(),
  },
}));

jest.mock('@/lib/entity', () => ({
  currentAt: jest.fn(),
}));

jest.mock('@/lib/request', () => ({
  respond: jest.fn(),
}));

jest.mock('@/lib/entities/wlf-builder/answer', () => ({
  updateWlfBuilder: jest.fn(),
}));

const mockedPublish = publishMessage as jest.MockedFunction<typeof publishMessage>;
const mockedAddEvent = EventTrackingController.addWlfBuilderEvent as jest.MockedFunction<
  typeof EventTrackingController.addWlfBuilderEvent
>;
const mockedCurrentAt = currentAt as jest.MockedFunction<typeof currentAt>;
const mockedRespond = respond as jest.MockedFunction<typeof respond>;
const mockedUpdateBuilder = updateWlfBuilder as jest.MockedFunction<typeof updateWlfBuilder>;

describe('handleAnswers', () => {
  const pid = 'pid-123';
  const NOW = 1_725_000_000_000; // fixed timestamp for stable tests

  beforeEach(() => {
    jest.resetAllMocks();
    mockedCurrentAt.mockReturnValue(NOW);

    mockedUpdateBuilder.mockReturnValue(Effect.succeed('updated-ok'));

    mockedRespond.mockImplementation((body: any, meta: any) => ({ ...body, ...meta }));

    mockedPublish.mockResolvedValue(undefined as any);
    mockedAddEvent.mockResolvedValue(undefined as any);
  });

  it('finished = false: merges answers, updates only "answers", does NOT publish or add event', async () => {
    const data = {
      id: 'a1',
      answers: JSON.stringify({ fieldA: 1, keepMe: true }),
      status: SurveyAnswerProcessStatus.InProgress,
      completedAt: undefined as number | undefined,
    } as any;

    const answer = { fieldB: 20, newField: 'x' };

    const result = await Effect.runPromise(WlfBuilderController.handleAnswers(data, answer, pid, false));

    expect(mockedUpdateBuilder).toHaveBeenCalledTimes(1);
    const [passedData, passedPid, fieldsToUpdate] = mockedUpdateBuilder.mock.calls[0];

    expect(passedPid).toBe(pid);
    expect(fieldsToUpdate).toEqual(['answers']);

    expect(JSON.parse(passedData.answers)).toEqual({
      fieldA: 1,
      keepMe: true,
      fieldB: 20,
      newField: 'x',
    });

    expect(passedData.completedAt).toBeUndefined();
    expect(passedData.status).toBe(SurveyAnswerProcessStatus.InProgress);

    expect(mockedPublish).not.toHaveBeenCalled();
    expect(mockedAddEvent).not.toHaveBeenCalled();

    expect(result).toBe('updated-ok');
  });

  it('finished = true: sets completedAt & status, merges answers, updates 3 fields, and fires publish + event', async () => {
    const data = {
      id: 'a2',
      answers: JSON.stringify({ base: 1 }),
      status: SurveyAnswerProcessStatus.InProgress,
      completedAt: undefined as number | undefined,
    } as any;

    const answer = { extra: 'yes' };

    const result = await Effect.runPromise(WlfBuilderController.handleAnswers(data, answer, pid, true));

    expect(mockedUpdateBuilder).toHaveBeenCalledTimes(1);
    const [passedData, passedPid, fieldsToUpdate] = mockedUpdateBuilder.mock.calls[0];

    expect(passedPid).toBe(pid);
    expect(fieldsToUpdate.sort()).toEqual(['answers', 'completedAt', 'status'].sort());

    expect(passedData.completedAt).toBe(NOW);
    expect(passedData.status).toBe(SurveyAnswerProcessStatus.Finished);

    expect(JSON.parse(passedData.answers)).toEqual({ base: 1, extra: 'yes' });

    expect(mockedRespond).toHaveBeenCalledWith({ answer: pid, type: SurveyType.WlfBuilder }, { pid });
    expect(mockedPublish).toHaveBeenCalledWith('process-answer', { answer: pid, type: SurveyType.WlfBuilder, pid });

    expect(mockedAddEvent).toHaveBeenCalledTimes(1);
    expect(mockedAddEvent).toHaveBeenCalledWith(pid, WlfBuilderEvents.Completed);

    expect(result).toBe('updated-ok');
  });

  it('propagates updateMOM failure', async () => {
    mockedUpdateBuilder.mockReturnValueOnce(Effect.fail(new Error('boom')));

    const data = {
      id: 'a3',
      answers: '{}',
      status: SurveyAnswerProcessStatus.InProgress,
    } as any;

    await expect(Effect.runPromise(WlfBuilderController.handleAnswers(data, { z: 1 }, pid, false))).rejects.toThrow(
      'boom',
    );

    expect(mockedPublish).not.toHaveBeenCalled();
    expect(mockedAddEvent).not.toHaveBeenCalled();
  });
});
