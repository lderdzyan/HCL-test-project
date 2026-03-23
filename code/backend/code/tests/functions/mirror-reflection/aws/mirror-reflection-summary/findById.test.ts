import { findById } from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection-summary';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { awsConfig } from '../../../../utils';
import { MirrorReflectionSummaryContentType } from '@/lib/entities/mirror-reflection/mirror-reflection';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doGet: jest.fn(),
}));

const mockedDoGet = require('@/lib/aws/dynamodb').doGet as jest.Mock;

describe('findById', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-summary-table' });
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

  it('returns Some(summary) if record exists', async () => {
    mockedDoGet.mockReturnValue(TE.right(mockSummary));

    const result = await findById(config, testId)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(O.isSome(result.right)).toBe(true);
      expect(result.right).toEqual(O.some(mockSummary));
    }
  });

  it('returns None if record is not found', async () => {
    mockedDoGet.mockReturnValue(TE.right(null));

    const result = await findById(config, testId)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.none);
    }
  });

  it('returns Left if doGet fails', async () => {
    const error = new Error('DDB error');
    mockedDoGet.mockReturnValue(TE.left(error));

    const result = await findById(config, testId)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
