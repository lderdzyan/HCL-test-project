import { listByUser } from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import * as TE from 'fp-ts/TaskEither';

import { awsConfig, mockJwtAud } from '../../../../utils';
import { SortKey } from '@/lib/aws/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { mirrorReflectionItems } from '../../../../utils/mirror-reflection/data';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doQuery: jest.fn(),
}));

const mockedDoQuery = require('@/lib/aws/dynamodb').doQuery as jest.Mock;

describe('listByUser', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns list of mirror reflections when results exist', async () => {
    mockedDoQuery.mockReturnValue(TE.right(mirrorReflectionItems));

    const result = await listByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(mirrorReflectionItems);
    }
  });

  it('returns empty array when no results found', async () => {
    mockedDoQuery.mockReturnValue(TE.right([]));

    const result = await listByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual([]);
    }
  });

  it('returns Left when query fails', async () => {
    const error = new Error('Query failed');
    mockedDoQuery.mockReturnValue(TE.left(error));

    const result = await listByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });

  it('constructs correct QueryCommand parameters', async () => {
    mockedDoQuery.mockReturnValue(TE.right([]));

    await listByUser(config, mockJwtAud)();

    const queryCommandArg = mockedDoQuery.mock.calls[0][1]; // second arg of first call
    expect(queryCommandArg).toBeInstanceOf(QueryCommand);
    expect(queryCommandArg.input).toEqual({
      TableName: 'mirror-reflection-table',
      IndexName: 'attr1-index',
      KeyConditionExpression: `#sk = :sortKey AND #attr = :attrValue`,
      ExpressionAttributeNames: {
        '#sk': '_sk',
        '#attr': 'attr1',
      },
      ExpressionAttributeValues: {
        ':sortKey': SortKey.MirrorReflection,
        ':attrValue': mockJwtAud,
      },
    });
  });
});
