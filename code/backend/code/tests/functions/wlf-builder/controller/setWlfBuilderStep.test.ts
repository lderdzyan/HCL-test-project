import { Effect, Option as O } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { getWlfBuilderByPid, updateWlfBuilder } from '@/lib/entities/wlf-builder/answer';
import { deepMerge } from '@/lib/utils/array-utils';

jest.mock('@/lib/entities/wlf-builder/answer', () => ({
  getWlfBuilderByPid: jest.fn(),
  updateWlfBuilder: jest.fn(),
}));

jest.mock('@/lib/utils/array-utils', () => ({
  deepMerge: jest.fn(),
}));

const mockedGetByPid = getWlfBuilderByPid as jest.MockedFunction<typeof getWlfBuilderByPid>;
const mockedUpdateBuilder = updateWlfBuilder as jest.MockedFunction<typeof updateWlfBuilder>;
const mockedDeepMerge = deepMerge as jest.Mock;

describe('setWlfBuilderStep', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('onSome: deep-merges and calls updateWlfBuilder with merged payload and fields list', async () => {
    const existing = { id: 'mom-1', step: 'introduction', some: 1 } as any;
    const data = { step: 'survey_progress', extra: 2 } as any;

    const merged = { id: 'mom-1', step: 'survey_progress', some: 1, extra: 2 } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(existing)));
    mockedDeepMerge.mockReturnValueOnce(merged);
    mockedUpdateBuilder.mockReturnValueOnce(Effect.succeed('ok' as any));

    const result = await Effect.runPromise(WlfBuilderController.setWlfBuilderStep(pid, data));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(mockedDeepMerge).toHaveBeenCalledWith(existing, data);

    const expectedFields = [Object.keys(data).join(',')];
    expect(mockedUpdateBuilder).toHaveBeenCalledWith(merged, pid, expectedFields);

    expect(result).toEqual('ok');
  });

  it('onNone: fails with "No existing WlfBuilder" and does not call updateWlfBuilder', async () => {
    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.none()));

    await expect(
      Effect.runPromise(WlfBuilderController.setWlfBuilderStep(pid, { step: 'whatever' } as any)),
    ).rejects.toThrow('No existing Builder');

    expect(mockedUpdateBuilder).not.toHaveBeenCalled();
    expect(mockedDeepMerge).not.toHaveBeenCalled();
  });

  it('propagates failure from getWlfBuilderFoundationsByPid', async () => {
    const err = new Error('fetch-fail');
    mockedGetByPid.mockReturnValueOnce(Effect.fail(err));

    await expect(Effect.runPromise(WlfBuilderController.setWlfBuilderStep(pid, { step: 'x' } as any))).rejects.toThrow(
      'fetch-fail',
    );

    expect(mockedUpdateBuilder).not.toHaveBeenCalled();
    expect(mockedDeepMerge).not.toHaveBeenCalled();
  });

  it('propagates failure from updateWlfBuilder', async () => {
    const existing = { id: 'mom-2', step: 'introduction' } as any;
    const data = { step: 'finished' } as any;
    const merged = { id: 'mom-2', step: 'finished' } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(existing)));
    mockedDeepMerge.mockReturnValueOnce(merged);
    mockedUpdateBuilder.mockReturnValueOnce(Effect.fail(new Error('update-fail')));

    await expect(Effect.runPromise(WlfBuilderController.setWlfBuilderStep(pid, data))).rejects.toThrow('update-fail');

    const expectedFields = [Object.keys(data).join(',')];
    expect(mockedUpdateBuilder).toHaveBeenCalledWith(merged, pid, expectedFields);
  });
});
