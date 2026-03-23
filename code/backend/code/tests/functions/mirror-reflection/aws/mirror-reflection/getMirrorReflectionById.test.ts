import { findById } from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { awsConfig, mockId } from '../../../../utils';
import { validMRItem } from '../../../../utils/mirror-reflection/data';
import { SortKey } from '@/lib/aws/dynamodb';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doGet: jest.fn(),
}));

const mockedDoGet = require('@/lib/aws/dynamodb').doGet as jest.Mock;

describe('findById', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Some(reflection) when record exists', async () => {
    mockedDoGet.mockReturnValue(TE.right(validMRItem));

    const result = await findById(config, mockId)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.some(validMRItem));
    }

    const commandArg = mockedDoGet.mock.calls[0][1];
    expect(commandArg.input).toEqual({
      TableName: 'mirror-reflection-table',
      Key: {
        _pk: mockId,
        _sk: SortKey.MirrorReflection,
      },
      ConsistentRead: true,
    });
  });

  it('returns None when record not found (null)', async () => {
    mockedDoGet.mockReturnValue(TE.right(null));

    const result = await findById(config, mockId)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.none);
    }
  });

  it('returns Left when doGet fails', async () => {
    const error = new Error('DB failure');
    mockedDoGet.mockReturnValue(TE.left(error));

    const result = await findById(config, mockId)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
