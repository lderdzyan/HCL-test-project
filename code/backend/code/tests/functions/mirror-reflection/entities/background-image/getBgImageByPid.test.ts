import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { callFunction } from '@/lib/entities';
import { getBgImageByPid } from '@/lib/entities/mirror-reflection/background-image';
import * as AWSBagroundImage from '@/lib/aws/dynamodb/mirror-reflection/background-image';
import { awsConfig, mockJwtAud } from '../../../../utils';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('getBgImageByPid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right(Some)', async () => {
    const mockValue = 3;
    const innerFn = jest.fn(() => TE.right(O.some(mockValue)));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getBgImageByPid(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSBagroundImage.findByUser);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(O.isSome(result.right)).toBe(true);
      if (O.isSome(result.right)) {
        expect(result.right.value).toBe(mockValue);
      }
    }
  });

  it('returns Right(None) if no value found', async () => {
    mockedCallFunction.mockReturnValue(() => TE.right(O.none));

    const task = getBgImageByPid(mockJwtAud);
    const result = await task();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right._tag).toBe('None');
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('Failure in callFunction');
    mockedCallFunction.mockReturnValue(() => TE.left(error));

    const task = getBgImageByPid(mockJwtAud);
    const result = await task();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
