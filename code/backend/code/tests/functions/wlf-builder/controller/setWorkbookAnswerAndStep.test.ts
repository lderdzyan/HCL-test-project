import { Effect, Option as O } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import {
  getWlfBuilderWorkbookByPid,
  createWlfBuilderWorkbook,
  updateWlfBuilderWorkbook,
  WorkbookStep,
} from '@/lib/entities/wlf-builder/workbook';
import { deepMerge } from '@/lib/utils/array-utils';

jest.mock('@/lib/entities/wlf-builder/workbook', () => {
  const actual = jest.requireActual('@/lib/entities/wlf-builder/workbook');
  return {
    ...actual,
    getWlfBuilderWorkbookByPid: jest.fn(),
    createWlfBuilderWorkbook: jest.fn(),
    updateWlfBuilderWorkbook: jest.fn(),
  };
});

jest.mock('@/lib/utils/array-utils', () => ({
  deepMerge: jest.fn(),
}));

const mockedGetByPid = getWlfBuilderWorkbookByPid as jest.MockedFunction<typeof getWlfBuilderWorkbookByPid>;
const mockedCreate = createWlfBuilderWorkbook as jest.MockedFunction<typeof createWlfBuilderWorkbook>;
const mockedUpdate = updateWlfBuilderWorkbook as jest.MockedFunction<typeof updateWlfBuilderWorkbook>;
const mockedDeepMerge = deepMerge as jest.Mock;

describe('setWorkbookAnswersAndStep', () => {
  const pid = 'pid-123';

  let eventSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    eventSpy = jest
      .spyOn(WlfBuilderController, 'createNeededEventForReport')
      .mockImplementation(() => Effect.succeed(undefined));
  });

  it('onNone: creates workbook with step=Overview and does NOT update or create event', async () => {
    const data = { id: 'w-1', step: 'SomeOtherStep', fieldA: 1 } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.none()));
    mockedCreate.mockReturnValueOnce(Effect.succeed('created-ok' as any));

    const result = await Effect.runPromise(WlfBuilderController.setWorkbookAnswersAndStep(pid, data));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);

    // Should override the incoming step with Overview
    expect(mockedCreate).toHaveBeenCalledWith({ ...data, step: WorkbookStep.Overview }, pid);

    // No update or event on create path
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(eventSpy).not.toHaveBeenCalled();

    expect(result).toEqual('created-ok');
  });

  it('onSome: deep-merges, updates with correct fields, and triggers event', async () => {
    const existing = { id: 'w-2', fieldA: 1, fieldB: 2 } as any;
    const data = { fieldB: 20, newField: 'x' } as any;
    const merged = { id: 'w-2', fieldA: 1, fieldB: 20, newField: 'x' } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(existing)));
    mockedDeepMerge.mockReturnValueOnce(merged);
    mockedUpdate.mockReturnValueOnce(Effect.succeed('updated-ok' as any));

    const result = await Effect.runPromise(WlfBuilderController.setWorkbookAnswersAndStep(pid, data));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(mockedDeepMerge).toHaveBeenCalledWith(existing, data);
    expect(mockedUpdate).toHaveBeenCalledWith(merged, pid, Object.keys(data));

    // this now hits
    expect(eventSpy).toHaveBeenCalledWith(data, pid);

    expect(result).toEqual('updated-ok');
  });

  it('propagates failure from getMOMWorkbookByPid', async () => {
    const err = new Error('fetch-fail');
    mockedGetByPid.mockReturnValueOnce(Effect.fail(err));

    await expect(
      Effect.runPromise(WlfBuilderController.setWorkbookAnswersAndStep(pid, { step: WorkbookStep.Overview } as any)),
    ).rejects.toThrow('fetch-fail');

    expect(mockedCreate).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(eventSpy).not.toHaveBeenCalled();
  });

  it('propagates failure from updateMOMWorkbook (onSome path)', async () => {
    const existing = { id: 'w-3', step: WorkbookStep.Overview } as any;
    const data = { step: WorkbookStep.Overview, k: 1 } as any;
    const merged = { id: 'w-3', step: WorkbookStep.Overview, k: 1 } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(existing)));
    mockedDeepMerge.mockReturnValueOnce(merged);
    mockedUpdate.mockReturnValueOnce(Effect.fail(new Error('update-fail')));

    await expect(Effect.runPromise(WlfBuilderController.setWorkbookAnswersAndStep(pid, data))).rejects.toThrow(
      'update-fail',
    );

    expect(eventSpy).not.toHaveBeenCalled();
  });

  it('propagates failure from createNeededEventForReport (tap)', async () => {
    const existing = { id: 'w-4', step: WorkbookStep.Overview } as any;
    const data = { step: WorkbookStep.Overview, foo: 'bar' } as any;
    const merged = { id: 'w-4', step: WorkbookStep.Overview, foo: 'bar' } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(existing)));
    mockedDeepMerge.mockReturnValueOnce(merged);
    mockedUpdate.mockReturnValueOnce(Effect.succeed('ok' as any));
    eventSpy.mockReturnValueOnce(Effect.fail(new Error('event-fail')) as any);

    await expect(Effect.runPromise(WlfBuilderController.setWorkbookAnswersAndStep(pid, data))).rejects.toThrow(
      'event-fail',
    );

    // Update still called before tap fails
    expect(mockedUpdate).toHaveBeenCalled();
  });
});
