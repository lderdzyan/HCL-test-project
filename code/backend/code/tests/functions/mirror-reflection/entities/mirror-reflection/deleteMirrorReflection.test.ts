import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '@/lib/entities';
import * as AWSMirrorReflection from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import { deleteMirrorReflection } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { mrId } from '../../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('deleteMirrorReflection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right', async () => {
    const innerFn = jest.fn(() => TE.right(mrId));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = deleteMirrorReflection(mrId);
    const result = await task();

    expect(innerFn).toHaveBeenCalled();
    expect(mockedCallFunction).toHaveBeenCalledWith(AWSMirrorReflection.deleteById);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mrId);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe(mrId);
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('delete failed');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = deleteMirrorReflection(mrId);
    const result = await task();

    expect(innerFn).toHaveBeenCalled();
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
