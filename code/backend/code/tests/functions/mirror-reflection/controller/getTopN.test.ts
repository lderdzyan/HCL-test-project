import { MirrorReflectionController } from '@/lib/controllers/mirror-reflection/mirror-reflection';

describe('getTopN', () => {
  it('returns top N entries sorted by count descending', () => {
    const input = {
      happy_day: 5,
      sad_day: 10,
      normal_day: 7,
      excited_day: 3,
    };
    const result = MirrorReflectionController.getTopN(input, 2);

    expect(result).toEqual([
      { label: 'sad day', count: 10 },
      { label: 'normal day', count: 7 },
    ]);
  });

  it('replaces underscores with spaces in labels', () => {
    const input = { very_happy: 2 };
    const result = MirrorReflectionController.getTopN(input, 1);

    expect(result).toEqual([{ label: 'very happy', count: 2 }]);
  });

  it('returns all items if n is greater than number of entries', () => {
    const input = {
      one: 1,
      two: 2,
    };

    const result = MirrorReflectionController.getTopN(input, 5);

    expect(result).toEqual([
      { label: 'two', count: 2 },
      { label: 'one', count: 1 },
    ]);
  });

  it('returns an empty array for empty input', () => {
    const input = {};
    const result = MirrorReflectionController.getTopN(input, 3);

    expect(result).toEqual([]);
  });

  it('returns an empty array if n is 0', () => {
    const input = {
      a: 1,
      b: 2,
    };

    const result = MirrorReflectionController.getTopN(input, 0);

    expect(result).toEqual([]);
  });
});
