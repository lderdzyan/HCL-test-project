import { MirrorReflectionController } from '@/lib/controllers/mirror-reflection/mirror-reflection';

describe('countOccurrences', () => {
  it('counts frequency of each word correctly', () => {
    const input = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
    const result = MirrorReflectionController.countOccurrences(input);

    expect(result).toEqual({
      apple: 3,
      banana: 2,
      orange: 1,
    });
  });

  it('returns an empty object for an empty array', () => {
    const result = MirrorReflectionController.countOccurrences([]);
    expect(result).toEqual({});
  });

  it('handles array with one word', () => {
    const result = MirrorReflectionController.countOccurrences(['single']);
    expect(result).toEqual({ single: 1 });
  });

  it('is case-sensitive', () => {
    const input = ['Apple', 'apple', 'APPLE'];
    const result = MirrorReflectionController.countOccurrences(input);

    expect(result).toEqual({
      Apple: 1,
      apple: 1,
      APPLE: 1,
    });
  });
});
