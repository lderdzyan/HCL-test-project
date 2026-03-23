import { getBackgroundImageByPid } from '@/functions/mirror-reflection/handlers/getBackgroundImageByPid';
import * as serviceModule from '@/lib/entities/mirror-reflection/background-image';
import * as TE from 'fp-ts/TaskEither';
import { createMockContext, mockJwtAud } from '../../../utils';

jest.mock('@/lib/entities/mirror-reflection/background-image');

describe('getBackgroundImageByPid handler', () => {
  const mockService = serviceModule.getBgImageByPid as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and getBackgroundImageByPid on successful load', async () => {
    const ctx = createMockContext({}, mockJwtAud);
    mockService.mockReturnValue(TE.of('success-id'));

    const result = await getBackgroundImageByPid(ctx);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud);

    expect(ctx.json).toHaveBeenCalledWith({ currentImage: 'success-id' }, 200);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ currentImage: 'success-id' });
  });

  it('should return 400 and error if getBackgroundImageByPid fails', async () => {
    const error = new Error('DB failure');
    const ctx = createMockContext({}, mockJwtAud);

    mockService.mockReturnValue(TE.left(error));

    const result = await getBackgroundImageByPid(ctx);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud);

    expect(ctx.json).toHaveBeenCalledWith({ error }, 400);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error });
  });
});
