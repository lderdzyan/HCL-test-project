import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { callFunction } from '@/lib/entities';
import { getMirrorReflectionById } from '@/lib/entities/mirror-reflection/mirror-reflection';
import * as AWSMirrorReflection from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import { mrId, validMRItem } from '../../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('getMirrorReflectionById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right(Some)', async () => {
    const innerFn = jest.fn(() => TE.right(O.some(validMRItem)));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionById(mrId);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSMirrorReflection.findById);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mrId);
    expect(innerFn).toHaveBeenCalled();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right._tag).toBe('Some');
      if (result.right._tag === 'Some') {
        expect(result.right.value).toEqual(validMRItem);
      }
    }
  });

  it('returns Right(None) when no data found', async () => {
    const innerFn = jest.fn(() => TE.right(O.none));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionById(mrId);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSMirrorReflection.findById);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mrId);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      const rightValue = result.right;
      expect(rightValue._tag).toBe('None');
    }
  });

  it('returns Left when callFunction fails', async () => {
    const error = new Error('Fetch error');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionById(mrId);
    const result = await task();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
