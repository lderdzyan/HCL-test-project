import { getMirrorReflection } from '@/functions/mirror-reflection/handlers/getMirrorReflectionById';
import * as serviceModule from '@/lib/entities/mirror-reflection/mirror-reflection';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { createMockContext, mockJwtAud, mockId, mockParams } from '../../../utils';
import { validMRItem } from '../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities/mirror-reflection/mirror-reflection');

describe('getMirrorReflection handler', () => {
  const mockService = serviceModule.getMirrorReflectionById as jest.Mock;

  const expectedParsedResult = {
    ...validMRItem,
    answers: JSON.parse(validMRItem.answers + ''),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and parsed mirror reflection on success', async () => {
    const ctx = createMockContext({}, mockJwtAud, mockParams);
    mockService.mockReturnValue(TE.of(O.some(validMRItem)));

    const result = await getMirrorReflection(ctx);

    expect(mockService).toHaveBeenCalledWith(mockId);
    expect(ctx.json).toHaveBeenCalledWith({ mr: expectedParsedResult }, 200);
    expect(result.status).toBe(200);
  });

  it('returns 400 when service returns error', async () => {
    const error = new Error('DB failure');
    const ctx = createMockContext({}, mockJwtAud, mockParams);

    mockService.mockReturnValue(TE.left(error));

    const result = await getMirrorReflection(ctx);

    expect(ctx.json).toHaveBeenCalledWith({ error }, 400);
    expect(result.status).toBe(400);
  });

  it('returns 400 when result is None (not found)', async () => {
    const ctx = createMockContext({}, mockJwtAud, mockParams);
    mockService.mockReturnValue(TE.of(O.none));

    const result = await getMirrorReflection(ctx);

    expect(ctx.json).toHaveBeenCalledWith({ error: new Error('Mirror reflection not exists.') }, 400);
    expect(result.status).toBe(400);
  });

  it('handles null answers safely', async () => {
    const ctx = createMockContext({}, mockJwtAud, mockParams);
    const input = [{ id: 'mr-1', name: 'Test', answers: null }];

    mockService.mockReturnValue(TE.of(O.some(input)));

    const result = await getMirrorReflection(ctx);

    expect(ctx.json).toHaveBeenCalledWith({ mr: input }, 200);
  });

  it('handles empty result array', async () => {
    const ctx = createMockContext({}, mockJwtAud, mockParams);
    mockService.mockReturnValue(TE.of(O.some([])));

    const result = await getMirrorReflection(ctx);

    expect(ctx.json).toHaveBeenCalledWith({ mr: [] }, 200);
    expect(result.status).toBe(200);
  });
});
