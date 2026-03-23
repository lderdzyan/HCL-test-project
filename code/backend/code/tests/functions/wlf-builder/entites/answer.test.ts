import { Effect } from 'effect';
import * as O from 'effect/Option';
import * as AWSMomFoundations from '@/lib/aws/dynamodb/wlf-builder/answer';
import { getWlfBuilderByPid, createWlfBuilder, updateWlfBuilder } from '@/lib/entities/wlf-builder/answer';
import config from '@/config';
import { callFunction } from '@/lib/entities';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

jest.mock('@/config', () => ({
  config: { awsConfig: { region: 'us-test-1' } },
}));

jest.mock('@/lib/aws/dynamodb/wlf-builder/answer', () => ({
  AWSMomFoundations: {
    findById: jest.fn(),
    createAnswers: jest.fn(),
    updateAnswers: jest.fn(),
  },
}));

const mockedCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;

describe('Worklife Fulfillment Builder API wrappers', () => {
  const pid = 'person-123';
  const answers = { alpha: 4.5 } as any;
  const surveyId = 'survey-42';
  const data = { id: 'answer-1', answers: JSON.stringify(answers) } as any;
  const fieldsToUpdate = ['answers', 'status'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getWlfBuilderFoundationsByPid
  describe('getWlfBuilderFoundationsByPid', () => {
    it('calls callFunction with AWSWFStatements.findById and forwards (awsConfig, pid); returns O.none', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed(O.none()));

      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSMomFoundations as any).findById);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(getWlfBuilderByPid(pid));

      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
      expect(O.isNone(result)).toBe(true);
    });

    it('returns O.some(value) when underlying Effect succeeds', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed(O.some(data)));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      const result = await Effect.runPromise(getWlfBuilderByPid(pid));

      expect(O.isSome(result)).toBe(true);
      expect(O.getOrNull(result)).toEqual(data);
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
    });

    it('propagates errors when underlying Effect fails', async () => {
      const error = new Error('findById failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(error));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(getWlfBuilderByPid(pid))).rejects.toThrow('findById failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
    });
  });

  //
  // createWlfBuilder
  //
  describe('createWlfBuilder', () => {
    it('calls callFunction with AWSMomFoundations.createAnswers and forwards (awsConfig, surveyId, pid); returns id', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed('created-id'));
      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSMomFoundations as any).createAnswers);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(createWlfBuilder(surveyId, pid));

      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, surveyId, pid);
      expect(result).toBe('created-id');
    });

    it('propagates failure from inner Effect', async () => {
      const error = new Error('create failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(error));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(createWlfBuilder(surveyId, pid))).rejects.toThrow('create failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, surveyId, pid);
    });
  });

  //
  // updateWlfBuilder
  //
  describe('updateWlfBuilder', () => {
    it('calls callFunction with AWSMomFoundations.updateAnswers and forwards (awsConfig, data, pid, fieldsToUpdate); returns id', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed('updated-id'));
      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSMomFoundations as any).updateAnswers);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(updateWlfBuilder(data, pid, fieldsToUpdate));

      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, data, pid, fieldsToUpdate);
      expect(result).toBe('updated-id');
    });

    it('propagates failure from inner Effect', async () => {
      const error = new Error('update failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(error));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(updateWlfBuilder(data, pid, fieldsToUpdate))).rejects.toThrow('update failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, data, pid, fieldsToUpdate);
    });
  });
});
