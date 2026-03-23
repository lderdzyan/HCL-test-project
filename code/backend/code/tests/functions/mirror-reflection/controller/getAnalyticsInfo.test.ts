import * as TE from 'fp-ts/TaskEither';
import { MirrorReflectionController } from '@/lib/controllers/mirror-reflection/mirror-reflection';
import { mockJwtAud } from '../../../utils';
import * as EventAnalytics from '@/lib/entities/event-tracking';

jest.mock('@/lib/entities/event-tracking', () => ({
  ...jest.requireActual('@/lib/entities/event-tracking'),
  getMRAnalyticsInfoFromEvents: jest.fn(),
}));

const mockedGetMRAnalyticsInfoFromEvents = EventAnalytics.getMRAnalyticsInfoFromEvents as jest.Mock;

describe('getAnalyticsInfo', () => {
  const mockData = [
    {
      feelingWords: ['happy', 'sad', 'happy'],
      topics: ['team', 'growth', 'team'],
      workLife: 'balanced',
    },
    {
      feelingWords: ['sad', 'curious'],
      topics: ['growth'],
      workLife: 'stressed',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns top 5 analytics for feelingWords, topics, and workLife', async () => {
    mockedGetMRAnalyticsInfoFromEvents.mockReturnValueOnce(TE.right(mockData));

    const task = MirrorReflectionController.getAnalyticsInfo(mockJwtAud, 123, 456);
    const result = await task();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right.feelingWords.length).toBeLessThanOrEqual(5);
      expect(result.right.topics.length).toBeLessThanOrEqual(5);
      expect(result.right.workLife.length).toBeLessThanOrEqual(5);
    }

    expect(mockedGetMRAnalyticsInfoFromEvents).toHaveBeenCalledWith(mockJwtAud, 123, 456);
  });

  it('returns Left if getMRAnalyticsInfoFromEvents fails', async () => {
    const error = new Error('Fetch failed');
    mockedGetMRAnalyticsInfoFromEvents.mockReturnValueOnce(TE.left(error));

    const task = MirrorReflectionController.getAnalyticsInfo(mockJwtAud, 123, 456);
    const result = await task();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
