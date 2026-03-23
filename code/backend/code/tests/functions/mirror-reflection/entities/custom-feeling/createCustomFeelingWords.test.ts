import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '@/lib/entities';
import { createCustomFeelingWords } from '@/lib/entities/mirror-reflection/custom-feeling';
import * as AWSCustomFeeling from '@/lib/aws/dynamodb/mirror-reflection/custom-feeling';
import { CustomFeelingType } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { CustomFeeling } from '@/lib/entities/mirror-reflection/custom-feeling';
import { mockJwtAud } from '../../../../utils';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('createCustomFeelingWords', () => {
  const mockFeelingWords = { type: CustomFeelingType.upFeeling, text: ['Happy'] } as CustomFeeling;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right', async () => {
    const innerFn = jest.fn(() => TE.right('created'));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = createCustomFeelingWords(mockFeelingWords, mockJwtAud);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSCustomFeeling.createCustomFeelings);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockFeelingWords, mockJwtAud);

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe('created');
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('Lambda failure');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = createCustomFeelingWords(mockFeelingWords, mockJwtAud);
    const result = await task();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
