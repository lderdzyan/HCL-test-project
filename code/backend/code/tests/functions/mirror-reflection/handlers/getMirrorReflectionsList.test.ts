import { getMirrorReflections } from '@/functions/mirror-reflection/handlers/getMirrorReflectionsList';
import * as serviceModule from '@/lib/entities/mirror-reflection/mirror-reflection';

import * as TE from 'fp-ts/TaskEither';
import { createMockContext, mockJwtAud } from '../../../utils';
import { validMRItem } from '../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities/mirror-reflection/mirror-reflection');

describe('getMirrorReflectionsListByUser handler', () => {
  const mockService = serviceModule.getMirrorReflectionsListByUser as jest.Mock;
  const validResults = [validMRItem];

  const expectValidResults = validResults.map((item) => ({
    ...item,
    answers: JSON.parse(item.answers + ''),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and feelingWordsData on successful load', async () => {
    const ctx = createMockContext({}, mockJwtAud);
    mockService.mockReturnValue(TE.of(validResults));

    const result = await getMirrorReflections(ctx);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud);

    expect(ctx.json).toHaveBeenCalledWith({ mirrorReflections: expectValidResults }, 200);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ mirrorReflections: expectValidResults });
  });

  it('should return 400 and error if getMirrorReflectionsListByUser fails', async () => {
    const error = new Error('DB failure');
    const ctx = createMockContext({}, mockJwtAud);

    mockService.mockReturnValue(TE.left(error));

    const result = await getMirrorReflections(ctx);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(mockService).toHaveBeenCalledWith(mockJwtAud);

    expect(ctx.json).toHaveBeenCalledWith({ error }, 400);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error });
  });
});
