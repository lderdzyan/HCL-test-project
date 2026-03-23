import { findByPersonIdForMRAnalytics } from '@/lib/aws/dynamodb/event-tracking';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as TE from 'fp-ts/TaskEither';

import { awsConfig, mockJwtAud } from '../../../utils';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doQuery: jest.fn(),
}));

const mockedDoQuery = require('@/lib/aws/dynamodb').doQuery as jest.Mock;

describe('findByPersonIdForMRAnalytics', () => {
  const config = awsConfig({ eventTracking: 'event-tracking-table' });
  const startOfDate = 1717200000000;
  const endOfDate = 1717804800000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns list of EventTracking on success', async () => {
    const mockData = [
      { id: 'id-1', attr1: mockJwtAud, createdAt: 1717200000001 },
      { id: 'id-2', attr1: mockJwtAud, createdAt: 1717300000000 },
    ];

    mockedDoQuery.mockReturnValue(TE.right(mockData));

    const result = await findByPersonIdForMRAnalytics(config, mockJwtAud, startOfDate, endOfDate)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(mockData);
    }

    expect(mockedDoQuery).toHaveBeenCalledWith(config, expect.any(QueryCommand));
  });

  it('returns Left when doQuery fails', async () => {
    const error = new Error('DynamoDB query failed');

    mockedDoQuery.mockReturnValue(TE.left(error));

    const result = await findByPersonIdForMRAnalytics(config, mockJwtAud, startOfDate, endOfDate)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
