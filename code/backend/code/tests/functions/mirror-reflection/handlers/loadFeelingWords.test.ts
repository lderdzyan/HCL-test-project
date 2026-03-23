import { loadFeelingWords } from '@/functions/mirror-reflection/handlers/loadFeelingWords';
import * as serviceModule from '@/lib/entities/mirror-reflection/custom-feeling';
import * as TE from 'fp-ts/TaskEither';
import { createMockContext, mockJwtAud } from '../../../utils';

jest.mock('@/lib/entities/mirror-reflection/custom-feeling');

describe('loadFeelingWords handler', () => {
  const mockService = serviceModule.getCustomFeelingByUser as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and feelingWordsData on successful load', async () => {
    const ctx = createMockContext({}, mockJwtAud);
    mockService.mockReturnValue(TE.of('success-id'));

    const result = await loadFeelingWords(ctx);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud);

    expect(ctx.json).toHaveBeenCalledWith({ feelingWords: 'success-id' }, 200);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ feelingWords: 'success-id' });
  });

  it('should return 400 and error if getCustomFeelingByUser fails', async () => {
    const error = new Error('DB failure');
    const ctx = createMockContext({}, mockJwtAud);

    mockService.mockReturnValue(TE.left(error));

    const result = await loadFeelingWords(ctx);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud);

    expect(ctx.json).toHaveBeenCalledWith({ error }, 400);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error });
  });
});
