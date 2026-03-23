import { EventTrackingController } from '@/lib/controllers/event-tracking';
import { EventType } from '@/lib/entities/event-tracking';

describe('addMirrorReflectionData', () => {
  const personId = 'person-123';

  it('should transform answers correctly and return EventTracking object', async () => {
    const answers = {
      'mr-2': { answer: ['  Happy  ', '  sad  ', 'Excited'] },
      'mr-7': { answer: ['team work', 'growth'] },
      'mr-8': { answer: ' Work Life Balanced ' },
    };

    const task = EventTrackingController.addMirrorReflectionData(answers as any, personId);
    const result = await task();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right.personId).toBe(personId);
      expect(result.right.type).toBe(EventType.MRAnalyticsEvent);
      expect(result.right.feelingWords).toEqual(['happy', 'sad', 'excited']);
      expect(result.right.topics).toEqual(['team_work', 'growth']);
      expect(result.right.workLife).toBe('work_life_balanced');
      expect(typeof result.right.createdAt).toBe('number');
    }
  });

  it('should return Left on error', async () => {
    const task = EventTrackingController.addMirrorReflectionData(undefined as any, personId);
    const result = await task();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toContain('Error:');
    }
  });
});
