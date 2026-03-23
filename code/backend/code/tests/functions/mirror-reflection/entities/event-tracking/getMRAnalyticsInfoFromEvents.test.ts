import * as TE from 'fp-ts/TaskEither';
import { callFunction } from '@/lib/entities';
import { getMRAnalyticsInfoFromEvents } from '@/lib/entities/event-tracking';
import * as AWSEventTracking from '@/lib/aws/dynamodb/event-tracking';
import { mockJwtAud } from '../../../../utils';
import { EventType } from '@/lib/entities/event-tracking';

jest.mock('@/lib/entities', () => ({
  callFunction: jest.fn(),
}));

const mockedCallFunction = callFunction as jest.Mock;

describe('getMRAnalyticsInfoFromEvents', () => {
  const mockStart = 1710000000;
  const mockEnd = 1720000000;

  const mockEvents = [
    {
      id: 'evt-1',
      personId: mockJwtAud,
      type: EventType.MRAnalyticsEvent,
      feelingWords: ['text1', 'text2'],
      topics: ['text3'],
      workLife: ['text4'],
      createdAt: mockStart,
    },
    {
      id: 'evt-2',
      personId: mockJwtAud,
      type: EventType.MRAnalyticsEvent,
      feelingWords: ['text1'],
      topics: ['text3'],
      workLife: ['text4'],
      createdAt: mockEnd,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls callFunction with correct arguments and returns Right', async () => {
    const innerFn = jest.fn(() => TE.right(mockEvents));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMRAnalyticsInfoFromEvents(mockJwtAud, mockStart, mockEnd);
    const result = await task();

    expect(mockedCallFunction).toHaveBeenCalledWith(AWSEventTracking.findByPersonIdForMRAnalytics);
    expect(innerFn).toHaveBeenCalledWith(expect.anything(), mockJwtAud, mockStart, mockEnd);
    expect(innerFn).toHaveBeenCalled();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(mockEvents);
    }
  });

  it('returns Left if callFunction fails', async () => {
    const error = new Error('Lambda failed');
    const innerFn = jest.fn(() => TE.left(error));
    mockedCallFunction.mockReturnValue(innerFn);

    const task = getMRAnalyticsInfoFromEvents(mockJwtAud, mockStart, mockEnd);
    const result = await task();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
