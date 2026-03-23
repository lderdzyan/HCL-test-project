import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '@/lib/entities';
import { addBackgroundImageById } from '@/lib/entities/mirror-reflection/background-image';
import * as AWSBagroundImage from '@/lib/aws/dynamodb/mirror-reflection/background-image';
import { mockJwtAud } from '../../../../utils';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('addBackgroundImageById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right', async () => {
    const mockResult = 'id-image';
    const innerFn = jest.fn(() => TE.right(mockResult));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = addBackgroundImageById(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSBagroundImage.addBackgroundImageById);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe(mockResult);
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('Dynamo error');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = addBackgroundImageById(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSBagroundImage.addBackgroundImageById);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
