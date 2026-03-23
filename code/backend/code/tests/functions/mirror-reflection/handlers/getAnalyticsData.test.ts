import { getAnalyticsData } from '@/functions/mirror-reflection/handlers/getAnalyticsData';
import * as validator from '@/functions/mirror-reflection/validators/getAnalyticsData';
import * as serviceModule from '@/lib/controllers/mirror-reflection/mirror-reflection';
import * as TE from 'fp-ts/TaskEither';
import {
  buildValidationErrorMock,
  buildValidationSuccessMock,
  createMockContext,
  getDateRangeInMs,
  mockJwtAud,
} from '../../../utils';

jest.mock('@/functions/mirror-reflection/validators/getAnalyticsData');
jest.mock('@/lib/controllers/mirror-reflection/mirror-reflection');

describe('getAnalyticsData handler', () => {
  const mockValidate = validator.validateGetAnalyticsData as jest.Mock;
  const mockService = serviceModule.MirrorReflectionController.getAnalyticsInfo as jest.Mock;
  const validBody = {
    startOfDate: 'Saturday, February 8, 2025 10:20:00 AM',
    endOfDate: 'Wednesday, June 4, 2025 6:52:03 AM',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and getAnalyticsData on successful creation', async () => {
    const { startOfDateTime, endOfDateTime } = getDateRangeInMs(validBody);
    const ctx = createMockContext(validBody);

    const successResult = {
      feelingWords: [
        { label: 'happy', count: 12 },
        { label: 'motivated', count: 10 },
      ],
      topics: [
        { label: 'team work', count: 9 },
        { label: 'deadlines', count: 7 },
      ],
      workLife: [
        { label: 'balanced', count: 15 },
        { label: 'stressful', count: 11 },
      ],
    };
    mockValidate.mockReturnValue(TE.of(buildValidationSuccessMock()));
    mockService.mockReturnValue(TE.of(successResult));
    const result = await getAnalyticsData(ctx);
    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockValidate).toHaveBeenCalledWith(validBody);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud, startOfDateTime, endOfDateTime);

    expect(ctx.json).toHaveBeenCalledWith({ analytics: successResult }, 200);
    expect(result.body).toEqual({ analytics: successResult });
    expect(result.status).toBe(200);
  });

  it('should return 400 and validation error if validation fails', async () => {
    const validationError = buildValidationErrorMock();
    const invalidBody = {
      startOfDate: null,
      endOfDate: '',
    };
    const ctx = createMockContext(invalidBody);
    mockValidate.mockReturnValue(TE.of(validationError));
    const result = await getAnalyticsData(ctx);

    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockValidate).toHaveBeenCalledWith(invalidBody);
    expect(ctx.json).toHaveBeenCalledWith({ error: validationError }, 400);

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: validationError });
    expect(mockService).not.toHaveBeenCalled();
  });

  it('should return 400 and error if getAnalyticsData fails', async () => {
    const error = new Error('DB failure');
    const ctx = createMockContext(validBody);
    const { startOfDateTime, endOfDateTime } = getDateRangeInMs(validBody);

    mockValidate.mockReturnValue(TE.of(buildValidationSuccessMock()));
    mockService.mockReturnValue(TE.left(error));
    const result = await getAnalyticsData(ctx);
    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud, startOfDateTime, endOfDateTime);
    expect(ctx.json).toHaveBeenCalledWith({ error }, 400);

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error });
  });

  it('should return 400 and error if body is undefined', async () => {
    const ctx = createMockContext(undefined);
    mockValidate.mockReturnValue(TE.of(buildValidationErrorMock()));
    const result = await getAnalyticsData(ctx);
    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(mockValidate).toHaveBeenCalledWith(undefined);
    expect(ctx.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }), 400);

    expect(result.status).toBe(400);
    expect(mockService).not.toHaveBeenCalled();
  });
});
