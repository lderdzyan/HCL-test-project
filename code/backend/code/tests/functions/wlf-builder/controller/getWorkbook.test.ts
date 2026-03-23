import { Effect, Option as O } from 'effect';

import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { getWlfBuilderWorkbookByPid } from '@/lib/entities/wlf-builder/workbook';

jest.mock('@/lib/entities/wlf-builder/workbook', () => ({
  getWlfBuilderWorkbookByPid: jest.fn(),
}));

const mockedGetByPid = getWlfBuilderWorkbookByPid as jest.MockedFunction<typeof getWlfBuilderWorkbookByPid>;

describe('getWorkbook', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the workbook when found (O.some)', async () => {
    const workbook = { id: 'w1', step: 'Intro' } as any;

    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.some(workbook)));

    const result = await Effect.runPromise(WlfBuilderController.getWorkbook(pid));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(result).toEqual(workbook);
  });

  it('returns null when not found (O.none)', async () => {
    mockedGetByPid.mockReturnValueOnce(Effect.succeed(O.none()));

    const result = await Effect.runPromise(WlfBuilderController.getWorkbook(pid));

    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
    expect(result).toBeNull();
  });

  it('propagates failures from getWlfBuilderWorkbookByPid', async () => {
    const err = new Error('boom');
    mockedGetByPid.mockReturnValueOnce(Effect.fail(err));

    await expect(Effect.runPromise(WlfBuilderController.getWorkbook(pid))).rejects.toThrow('boom');
    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
  });
});
