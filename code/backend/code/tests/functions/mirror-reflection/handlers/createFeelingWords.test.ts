import { createFeelingWords } from '@/functions/mirror-reflection/handlers/createFeelingWords';
import * as validator from '@/functions/mirror-reflection/validators/createFeelingWords';
import * as serviceModule from '@/lib/entities/mirror-reflection/custom-feeling';
import * as TE from 'fp-ts/TaskEither';
import { buildValidationErrorMock, buildValidationSuccessMock, createMockContext, mockJwtAud } from '../../../utils';

jest.mock('@/functions/mirror-reflection/validators/createFeelingWords');
jest.mock('@/lib/entities/mirror-reflection/custom-feeling');

describe('createFeelingWords handler', () => {
  const mockValidate = validator.validateCreateFeelingWords as jest.Mock;
  const mockService = serviceModule.createCustomFeelingWords as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and feelingWordsData on successful creation', async () => {
    const validBody = {
      type: 'UpFeeling',
      text: ['Happy'],
    };
    const ctx = createMockContext(validBody);

    mockValidate.mockReturnValue(TE.of(buildValidationSuccessMock()));
    mockService.mockReturnValue(TE.of('success-id'));

    const result = await createFeelingWords(ctx);

    expect(mockValidate).toHaveBeenCalledWith(validBody);
    expect(mockService).toHaveBeenCalledWith(validBody, mockJwtAud);
    expect(ctx.json).toHaveBeenCalledWith({ feelingWordsData: 'success-id' }, 200);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ feelingWordsData: 'success-id' });
  });

  it('should return 400 and validation error if validation fails', async () => {
    const invalidBody = { type: '', text: [] };
    const ctx = createMockContext(invalidBody);
    const validationError = buildValidationErrorMock();
    mockValidate.mockReturnValue(TE.of(validationError));

    const result = await createFeelingWords(ctx);

    expect(mockValidate).toHaveBeenCalledWith(invalidBody);
    expect(ctx.json).toHaveBeenCalledWith({ error: validationError }, 400);

    expect(result.status).toBe(400);
    expect(mockService).not.toHaveBeenCalled();
  });

  it('should return 400 and error if createCustomFeelingWords fails', async () => {
    const validBody = { type: 'UpFeeling', text: ['Happy'] };
    const ctx = createMockContext(validBody);
    const error = new Error('DB failure');

    mockValidate.mockReturnValue(TE.of(buildValidationSuccessMock()));
    mockService.mockReturnValue(TE.left(error));

    const result = await createFeelingWords(ctx);

    expect(mockService).toHaveBeenCalledWith(validBody, mockJwtAud);
    expect(ctx.json).toHaveBeenCalledWith({ error }, 400);

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error });
  });

  it('should return 400 and error if body is undefined', async () => {
    const ctx = createMockContext(undefined);

    mockValidate.mockReturnValue(TE.of(buildValidationErrorMock()));

    const result = await createFeelingWords(ctx);

    expect(mockValidate).toHaveBeenCalledWith(undefined);
    expect(ctx.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }), 400);

    expect(result.status).toBe(400);
    expect(mockService).not.toHaveBeenCalled();
  });
});
