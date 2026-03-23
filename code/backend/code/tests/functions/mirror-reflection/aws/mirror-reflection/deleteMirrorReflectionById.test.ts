import { deleteById } from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import * as TE from 'fp-ts/TaskEither';

import { awsConfig, mockId } from '../../../../utils';
import { SortKey } from '@/lib/aws/dynamodb';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doDelete: jest.fn(),
}));

const mockedDoDelete = require('@/lib/aws/dynamodb').doDelete as jest.Mock;

describe('deleteById', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Right with id on successful delete', async () => {
    mockedDoDelete.mockReturnValue(TE.right(mockId));

    const result = await deleteById(config, mockId)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe(mockId);
    }

    expect(mockedDoDelete).toHaveBeenCalledWith(
      { ...config, ddbTable: 'mirror-reflection-table' },
      mockId,
      SortKey.MirrorReflection,
    );
  });

  it('returns Right(undefined) if id does not exist', async () => {
    mockedDoDelete.mockReturnValue(TE.right(undefined));

    const result = await deleteById(config, mockId)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBeUndefined();
    }

    expect(mockedDoDelete).toHaveBeenCalledWith(
      { ...config, ddbTable: 'mirror-reflection-table' },
      mockId,
      SortKey.MirrorReflection,
    );
  });

  it('returns Left on error from doDelete', async () => {
    const error = new Error('Delete failed');
    mockedDoDelete.mockReturnValue(TE.left(error));

    const result = await deleteById(config, mockId)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
