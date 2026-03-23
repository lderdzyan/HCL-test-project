import { Effect, Option as O } from 'effect';
import { WlfBuilderController } from '@/lib/controllers/wlf-builder';
import { getWlfBuilderWorkbookByPid, WorkbookStep } from '@/lib/entities/wlf-builder/workbook';

jest.mock('@/lib/entities/wlf-builder/workbook', () => {
  const actual = jest.requireActual('@/lib/entities/wlf-builder/workbook');
  return {
    ...actual,
    getWlfBuilderWorkbookByPid: jest.fn(),
  };
});

const mockedGetByPid = getWlfBuilderWorkbookByPid as jest.MockedFunction<typeof getWlfBuilderWorkbookByPid>;

describe('getPendingWlfBuilderWorkbook', () => {
  const pid = 'pid-123';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns O.none when no workbook exists', async () => {
    mockedGetByPid.mockReturnValue(Effect.succeed(O.none()));

    const result = await Effect.runPromise(WlfBuilderController.getPendingWlfBuilderWorkbook(pid));

    expect(result).toEqual(O.none());
    expect(mockedGetByPid).toHaveBeenCalledWith(pid);
  });

  it('returns O.none when workbook step is Summary', async () => {
    const workbook = { id: 'w1', step: WorkbookStep.Summary } as any;
    mockedGetByPid.mockReturnValue(Effect.succeed(O.some(workbook)));

    const result = await Effect.runPromise(WlfBuilderController.getPendingWlfBuilderWorkbook(pid));

    expect(result).toEqual(O.none());
  });

  it('returns O.some(id) when workbook step is not Summary', async () => {
    const workbook = { id: 'w2', step: WorkbookStep.FocusAreas } as any;
    mockedGetByPid.mockReturnValue(Effect.succeed(O.some(workbook)));

    const result = await Effect.runPromise(WlfBuilderController.getPendingWlfBuilderWorkbook(pid));

    expect(result).toEqual(O.some('w2'));
  });

  it('propagates errors from getWlfBuilderWorkbookByPid', async () => {
    mockedGetByPid.mockReturnValue(Effect.fail(new Error('db-error')));

    await expect(Effect.runPromise(WlfBuilderController.getPendingWlfBuilderWorkbook(pid))).rejects.toThrow('db-error');
  });
});
