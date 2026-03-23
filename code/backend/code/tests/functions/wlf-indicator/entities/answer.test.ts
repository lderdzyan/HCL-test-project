import { Effect, Option as O } from 'effect';

import { callFunction } from '@/lib/entities';
import * as AWSIndicator from '@/lib/aws/dynamodb/wlf-indicator/answer';
import { createIndicator, getIndicatorByPid, updateIndicator } from '@/lib/entities/wlf-indicator/answer';
import config from '@/config';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

jest.mock('@/lib/aws/dynamodb/wlf-indicator/answer', () => ({
  AWSWFStatements: {
    findById: jest.fn(),
    createAnswers: jest.fn(),
    updateAnswers: jest.fn(),
  },
}));

jest.mock('@/config', () => ({
  config: { awsConfig: { region: 'us-test-1' } },
}));

const mockedCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;

describe('Worklife Fulfillment Statements API wrappers', () => {
  const pid = 'person-123';
  const answers = { alpha: 4.5 } as any;
  const surveyId = 'survey-42';
  const data = { id: 'answer-1', answers: JSON.stringify(answers) } as any;
  const fieldsToUpdate = ['answers', 'status'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getWFStatementsByPid
  describe('getWFStatementsByPid', () => {
    it('calls callFunction with AWSWFStatements.findById and forwards (awsConfig, pid); returns O.none', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed(O.none()));

      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSIndicator as any).findById);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(getIndicatorByPid(pid));

      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
      expect(O.isNone(result)).toBe(true);
    });

    it('returns O.some(value) when underlying Effect succeeds', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed(O.some(data)));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      const result = await Effect.runPromise(getIndicatorByPid(pid));

      expect(O.isSome(result)).toBe(true);
      expect(O.getOrNull(result)).toEqual(data);
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
    });

    it('propagates errors when underlying Effect fails', async () => {
      const error = new Error('findById failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(error));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(getIndicatorByPid(pid))).rejects.toThrow('findById failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
    });
  });

  //
  // createWlf
  //
  describe('createWlf', () => {
    it('calls callFunction with AWSWFStatements.createAnswers and forwards (awsConfig, answers, surveyId, pid); returns id', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed('created-id'));
      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSIndicator as any).createAnswers);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(createIndicator(answers, surveyId, pid));

      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, answers, surveyId, pid);
      expect(result).toBe('created-id');
    });

    it('propagates failure from inner Effect', async () => {
      const error = new Error('create failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(error));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(createIndicator(answers, surveyId, pid))).rejects.toThrow('create failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, answers, surveyId, pid);
    });
  });

  //
  // updateWlf
  //
  describe('updateWlf', () => {
    it('calls callFunction with AWSWFStatements.updateAnswers and forwards (awsConfig, data, pid, fieldsToUpdate); returns id', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed('updated-id'));
      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSIndicator as any).updateAnswers);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(updateIndicator(data, pid, fieldsToUpdate));

      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, data, pid, fieldsToUpdate);
      expect(result).toBe('updated-id');
    });

    it('propagates failure from inner Effect', async () => {
      const error = new Error('update failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(error));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(updateIndicator(data, pid, fieldsToUpdate))).rejects.toThrow('update failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, data, pid, fieldsToUpdate);
    });
  });
});
