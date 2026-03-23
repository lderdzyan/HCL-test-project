import { Effect, Option as O } from 'effect';

import * as AWSWLFBuilderWorkbook from '@/lib/aws/dynamodb/wlf-builder/workbook';
import { callFunction } from '@/lib/entities';
import config from '@/config';
import {
  createWlfBuilderWorkbook,
  getWlfBuilderWorkbookByPid,
  getWorkbooksByDate,
  WlfBuilderWorkbook,
  updateWlfBuilderWorkbook,
  WorkbookStep,
} from '@/lib/entities/wlf-builder/workbook';

jest.mock('@/lib/entities', () => ({
  __esModule: true,
  callFunction: jest.fn(),
}));

jest.mock('@/lib/aws/dynamodb/wlf-builder/workbook', () => ({
  __esModule: true,
  findById: jest.fn(),
  createWorkbook: jest.fn(),
  updateWorkbook: jest.fn(),
  findAllForReponseReport: jest.fn(),
}));

jest.mock('@/config', () => ({
  __esModule: true,
  default: { awsConfig: { region: 'us-test-1' } },
}));

const mockedCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;

const mockFindById = AWSWLFBuilderWorkbook.findById as jest.Mock;
const mockCreateWorkbook = AWSWLFBuilderWorkbook.createWorkbook as jest.Mock;
const mockUpdateWorkbook = AWSWLFBuilderWorkbook.updateWorkbook as jest.Mock;
const mockFindAllForReponseReport = AWSWLFBuilderWorkbook.findAllForReponseReport as jest.Mock;

describe('WLF Builder Workbook API wrappers', () => {
  const pid = 'person-123';
  const workbook = { id: 'plan-1', step: WorkbookStep.Overview } as WlfBuilderWorkbook;
  const fieldsToUpdate = ['step', 'updatedAt'];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCallFunction.mockImplementation(
      (fn: any) =>
        (...args: any[]) =>
          fn(...args),
    );
  });

  // getWlfBuilderWorkbookByPid
  describe('getWlfBuilderWorkbookByPid', () => {
    it('forwards (awsConfig, pid) and returns O.none', async () => {
      mockFindById.mockReturnValueOnce(Effect.succeed(O.none()));

      const result = await Effect.runPromise(getWlfBuilderWorkbookByPid(pid));

      expect(mockFindById).toHaveBeenCalledTimes(1);
      expect(mockFindById).toHaveBeenCalledWith(config.awsConfig, pid);
      expect(O.isNone(result)).toBe(true);
    });

    it('returns O.some(workbook)', async () => {
      mockFindById.mockReturnValueOnce(Effect.succeed(O.some(workbook)));

      const result = await Effect.runPromise(getWlfBuilderWorkbookByPid(pid));

      expect(O.isSome(result)).toBe(true);
      expect(O.getOrNull(result)).toEqual(workbook);
      expect(mockFindById).toHaveBeenCalledWith(config.awsConfig, pid);
    });

    it('propagates failure', async () => {
      mockFindById.mockReturnValueOnce(Effect.fail(new Error('findById failed')));

      await expect(Effect.runPromise(getWlfBuilderWorkbookByPid(pid))).rejects.toThrow('findById failed');
      expect(mockFindById).toHaveBeenCalledWith(config.awsConfig, pid);
    });
  });

  // createWlfBuilderWorkbook
  describe('createWlfBuilderWorkbook', () => {
    it('forwards (awsConfig, data, pid) and returns id', async () => {
      mockCreateWorkbook.mockReturnValueOnce(Effect.succeed('new-plan-id'));

      const out = await Effect.runPromise(createWlfBuilderWorkbook(workbook, pid));

      expect(out).toBe('new-plan-id');
      expect(mockCreateWorkbook).toHaveBeenCalledTimes(1);
      expect(mockCreateWorkbook).toHaveBeenCalledWith(config.awsConfig, workbook, pid);
    });

    it('propagates failure', async () => {
      mockCreateWorkbook.mockReturnValueOnce(Effect.fail(new Error('create failed')));

      await expect(Effect.runPromise(createWlfBuilderWorkbook(workbook, pid))).rejects.toThrow('create failed');
      expect(mockCreateWorkbook).toHaveBeenCalledWith(config.awsConfig, workbook, pid);
    });
  });

  // updateWlfBuilderWorkbook
  describe('updateWlfBuilderWorkbook', () => {
    it('forwards (awsConfig, data, pid, fieldsToUpdate) and returns id', async () => {
      mockUpdateWorkbook.mockReturnValueOnce(Effect.succeed('updated-plan-id'));

      const out = await Effect.runPromise(updateWlfBuilderWorkbook(workbook, pid, fieldsToUpdate));

      expect(out).toBe('updated-plan-id');
      expect(mockUpdateWorkbook).toHaveBeenCalledTimes(1);
      expect(mockUpdateWorkbook).toHaveBeenCalledWith(config.awsConfig, workbook, pid, fieldsToUpdate);
    });

    it('propagates failure', async () => {
      mockUpdateWorkbook.mockReturnValueOnce(Effect.fail(new Error('update failed')));

      await expect(Effect.runPromise(updateWlfBuilderWorkbook(workbook, pid, fieldsToUpdate))).rejects.toThrow(
        'update failed',
      );
      expect(mockUpdateWorkbook).toHaveBeenCalledWith(config.awsConfig, workbook, pid, fieldsToUpdate);
    });
  });

  // getWorkbooksByDate
  describe('getWorkbooksByDate', () => {
    it('forwards (awsConfig, start, end) and returns list', async () => {
      const start = 1710000000000;
      const end = 1710086400000;
      const list: WlfBuilderWorkbook[] = [
        { id: 'a', step: WorkbookStep.Wellbeing } as any,
        { id: 'b', step: WorkbookStep.Summary } as any,
      ];

      mockFindAllForReponseReport.mockReturnValueOnce(Effect.succeed(list));

      const result = await Effect.runPromise(getWorkbooksByDate(start, end));
      expect(result).toEqual(list);

      expect(mockFindAllForReponseReport).toHaveBeenCalledTimes(1);
      expect(mockFindAllForReponseReport).toHaveBeenCalledWith(config.awsConfig, start, end);
    });

    it('propagates failure from AWS', async () => {
      mockFindAllForReponseReport.mockReturnValueOnce(Effect.fail(new Error('range-fail')));
      await expect(Effect.runPromise(getWorkbooksByDate(1, 2))).rejects.toThrow('range-fail');
    });
  });
});
