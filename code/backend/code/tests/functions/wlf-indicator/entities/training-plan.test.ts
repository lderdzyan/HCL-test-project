import { Effect, Option as O } from 'effect';

import * as AWSWLFTrainingPlan from '@/lib/aws/dynamodb/wlf-indicator/training-plan';
import { callFunction } from '@/lib/entities';
import config from '@/config';
import {
  createIndicatorTrainingPlan,
  getIndicatorTrainingPlanByPid,
  updateIndicatorTrainingPlan,
} from '@/lib/entities/wlf-indicator/training-plan';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

jest.mock('@/lib/aws/dynamodb/wlf-indicator//answer', () => ({
  AWSWLFTrainingPlan: {
    findById: jest.fn(),
    createTrainingPlan: jest.fn(),
    updateTrainingPlan: jest.fn(),
  },
}));

jest.mock('@/config', () => ({
  config: { awsConfig: { region: 'us-test-1' } },
}));

const mockedCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;

describe('WLF Training Plan API wrappers', () => {
  const pid = 'person-123';
  const plan = { id: 'plan-1', step: 'Alpha' } as any;
  const fieldsToUpdate = ['step', 'updatedAt'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getWFSTrainingPlanByPid
  describe('getWFSTrainingPlanByPid', () => {
    it('passes AWSWLFTrainingPlan.findById into callFunction and forwards (awsConfig, pid); returns O.none', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed(O.none()));

      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSWLFTrainingPlan as any).findById);
        return invokerMock as any;
      });

      const result = await Effect.runPromise(getIndicatorTrainingPlanByPid(pid));

      expect(invokerMock).toHaveBeenCalledTimes(1);
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
      expect(O.isNone(result)).toBe(true);
    });

    it('returns O.some(plan) when underlying invoker succeeds with a value', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed(O.some(plan)));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      const result = await Effect.runPromise(getIndicatorTrainingPlanByPid(pid));

      expect(O.isSome(result)).toBe(true);
      expect(O.getOrNull(result)).toEqual(plan);
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
    });

    it('propagates failure when underlying Effect fails', async () => {
      const err = new Error('findById failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(err));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(getIndicatorTrainingPlanByPid(pid))).rejects.toThrow('findById failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, pid);
    });
  });

  // createWlfTrainingPlan
  describe('createWlfTrainingPlan', () => {
    it('passes AWSWLFTrainingPlan.createTrainingPlan and forwards (awsConfig, answers, pid); returns id', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed('new-plan-id'));
      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSWLFTrainingPlan as any).createTrainingPlan);
        return invokerMock as any;
      });

      const out = await Effect.runPromise(createIndicatorTrainingPlan(plan, pid));

      expect(invokerMock).toHaveBeenCalledTimes(1);
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, plan, pid);
      expect(out).toBe('new-plan-id');
    });

    it('propagates failure from the inner Effect', async () => {
      const err = new Error('create failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(err));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(createIndicatorTrainingPlan(plan, pid))).rejects.toThrow('create failed');
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, plan, pid);
    });
  });

  // updateWlfTrainingPlan
  describe('updateWlfTrainingPlan', () => {
    it('passes AWSWLFTrainingPlan.updateTrainingPlan and forwards (awsConfig, data, pid, fieldsToUpdate); returns id', async () => {
      const invokerMock = jest.fn().mockReturnValue(Effect.succeed('updated-plan-id'));
      mockedCallFunction.mockImplementation((fn: unknown) => {
        expect(fn).toBe((AWSWLFTrainingPlan as any).updateTrainingPlan);
        return invokerMock as any;
      });

      const out = await Effect.runPromise(updateIndicatorTrainingPlan(plan, pid, fieldsToUpdate));

      expect(invokerMock).toHaveBeenCalledTimes(1);
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, plan, pid, fieldsToUpdate);
      expect(out).toBe('updated-plan-id');
    });

    it('propagates failure from the inner Effect', async () => {
      const err = new Error('update failed');
      const invokerMock = jest.fn().mockReturnValue(Effect.fail(err));
      mockedCallFunction.mockImplementation(() => invokerMock as any);

      await expect(Effect.runPromise(updateIndicatorTrainingPlan(plan, pid, fieldsToUpdate))).rejects.toThrow(
        'update failed',
      );
      expect(invokerMock).toHaveBeenCalledWith(config.awsConfig, plan, pid, fieldsToUpdate);
    });
  });
});
