import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { callFunction } from '@/lib/entities';
import * as AWSMirrorReflectionSummary from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection-summary';
import { getMirrorReflectionSummaryById } from '@/lib/entities/mirror-reflection/mirror-reflection-summary';
import { mockJwtAud } from '../../../../utils';
import { MirrorReflectionSummaryContentType } from '@/lib/entities/mirror-reflection/mirror-reflection';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('getMirrorReflectionSummaryById', () => {
  const mockId = mockJwtAud;
  const testId = 'summary-id-123';
  const mockSummary = {
    id: testId,
    pid: 'user-123',
    type: MirrorReflectionSummaryContentType.FeelingWord,
    text: ['text1', 'text2'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right(Some)', async () => {
    const innerFn = jest.fn(() => TE.right(O.some(mockSummary)));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionSummaryById(mockId);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSMirrorReflectionSummary.findById);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockId);
    expect(innerFn).toHaveBeenCalled();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right._tag).toBe('Some');
      if (result.right._tag === 'Some') {
        expect(result.right.value).toEqual(mockSummary);
      }
    }
  });

  it('returns Right(None) when no data found', async () => {
    const innerFn = jest.fn(() => TE.right(O.none));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionSummaryById(mockId);
    const result = await task();

    expect(innerFn).toHaveBeenCalled();
    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right._tag).toBe('None');
    }
  });

  it('returns Left on error', async () => {
    const error = new Error('Summary fetch failed');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMirrorReflectionSummaryById(mockId);
    const result = await task();

    expect(innerFn).toHaveBeenCalled();
    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
