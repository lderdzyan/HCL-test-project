import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '@/lib/entities';
import * as AWSMirrorReflection from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import { doCreateMirrorReflection } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { mockJwtAud } from '../../../../utils';
import { validMRAnswer } from '../../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('doCreateMirrorReflection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right', async () => {
    const innerFn = jest.fn(() => TE.right('id-mr'));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = doCreateMirrorReflection(validMRAnswer, mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSMirrorReflection.createMirrorReflection);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), validMRAnswer, mockJwtAud);

    expect(innerFn).toHaveBeenCalled();
    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe('id-mr');
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('Lambda error');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = doCreateMirrorReflection(validMRAnswer, mockJwtAud);
    const result = await task();

    expect(innerFn).toHaveBeenCalled();
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
