import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '@/lib/entities';
import * as AWSMirrorReflection from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import { getMirrorReflectionsListByUser } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { mirrorReflectionItems } from '../../../../utils/mirror-reflection/data'; // Убедись, что путь и данные валидные
import { mockJwtAud } from '../../../../utils';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('getMirrorReflectionsListByUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right with data', async () => {
    const innerFn = jest.fn(() => TE.right(mirrorReflectionItems));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionsListByUser(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSMirrorReflection.listByUser);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);
    expect(innerFn).toHaveBeenCalled();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(mirrorReflectionItems);
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('Failed to get list');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionsListByUser(mockJwtAud);
    const result = await task();

    expect(innerFn).toHaveBeenCalled();
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
