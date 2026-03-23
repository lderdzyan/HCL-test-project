import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { callFunction } from '@/lib/entities';
import { getCustomFeelingByUser } from '@/lib/entities/mirror-reflection/custom-feeling';
import * as AWSCustomFeeling from '@/lib/aws/dynamodb/mirror-reflection/custom-feeling';
import { CustomFeelingType } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { mockJwtAud } from '../../../../utils';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('getCustomFeelingByUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right(Some)', async () => {
    const mockData = [{ id: 'id1', type: CustomFeelingType.upFeeling, text: ['Happy'] }];
    const innerFn = jest.fn(() => TE.right(O.some(mockData)));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getCustomFeelingByUser(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSCustomFeeling.findByUser);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right' && O.isSome(result.right)) {
      expect(result.right.value).toEqual(mockData);
    }
  });

  it('returns Right(None) if no data found', async () => {
    const innerFn = jest.fn(() => TE.right(O.none));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getCustomFeelingByUser(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSCustomFeeling.findByUser);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(O.isNone(result.right)).toBe(true);
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('callFunction failed');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getCustomFeelingByUser(mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSCustomFeeling.findByUser);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud);

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
