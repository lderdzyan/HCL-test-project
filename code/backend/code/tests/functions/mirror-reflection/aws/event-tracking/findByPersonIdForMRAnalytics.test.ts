import * as TE from 'fp-ts/TaskEither';
import { findByPersonIdForMRAnalytics } from '@/lib/aws/dynamodb/event-tracking';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { doQuery } from '@/lib/aws/dynamodb';
import { EventType } from '@/lib/entities/event-tracking';

jest.mock('@/lib/aws/dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  QueryCommand: jest.fn(),
}));

const mockedDoQuery = doQuery as jest.Mock;

describe('findByPersonIdForMRAnalytics', () => {
  const mockConfig = {
    ddbTables: {
      eventTracking: 'EventTrackingTable',
    },
  };
  const personId = 'person-123';
  const startOfDate = 1622505600;
  const endOfDate = 1625097600;

  const mockEvents = [
    { id: 'evt1', eventType: EventType.MRAnalyticsEvent, attr1: personId, createdAt: 1623000000 },
    { id: 'evt2', eventType: EventType.MRAnalyticsEvent, attr1: personId, createdAt: 1624000000 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls doQuery with correct QueryCommand and returns events on success', async () => {
    mockedDoQuery.mockReturnValueOnce(TE.right(mockEvents));

    const result = await findByPersonIdForMRAnalytics(mockConfig as any, personId, startOfDate, endOfDate)();

    expect(QueryCommand).toHaveBeenCalledWith({
      TableName: mockConfig.ddbTables.eventTracking,
      IndexName: 'attr1-index',
      KeyConditionExpression: '#sk = :sortKey AND #attr = :attrValue',
      FilterExpression: '#created BETWEEN :attrValue1 AND :attrValue2',
      ExpressionAttributeNames: { '#sk': '_sk', '#attr': 'attr1', '#created': 'createdAt' },
      ExpressionAttributeValues: {
        ':sortKey': EventType.MRAnalyticsEvent,
        ':attrValue': personId,
        ':attrValue1': startOfDate,
        ':attrValue2': endOfDate,
      },
    });

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(mockEvents);
    }
  });

  it('returns Left if doQuery fails', async () => {
    const error = new Error('Query failed');
    mockedDoQuery.mockReturnValueOnce(TE.left(error));

    const result = await findByPersonIdForMRAnalytics(mockConfig as any, personId, startOfDate, endOfDate)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
