import { deepMerge, isValidArray } from '@/lib/utils/array-utils';

describe('isValidArray', () => {
  it('returns true for a non-empty array', () => {
    expect(isValidArray([1, 2, 3])).toBe(true);
    expect(isValidArray(['a'])).toBe(true);
  });

  it('returns false for an empty array', () => {
    expect(isValidArray([])).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isValidArray(null as any)).toBe(false);
    expect(isValidArray(undefined as any)).toBe(false);
  });

  it('treats falsy elements as valid content (still true)', () => {
    expect(isValidArray([0, '', false, null as any])).toBe(true);
  });
});

describe('deepMerge', () => {
  it('merges shallow distinct keys', () => {
    const target = { a: 1 };
    const source = { b: 2, a: 1 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('overwrites primitive values', () => {
    const target = { a: 1 };
    const result = deepMerge(target, { a: 42 });
    expect(result).toEqual({ a: 42 });
  });

  it('deep-merges nested objects', () => {
    const target = { a: { x: 1, y: 2 } };
    const source = { a: { y: 3, z: 4, x: 1 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { x: 1, y: 3, z: 4 } });
  });

  it('overwrites arrays instead of merging them', () => {
    const target = { list: [1, 2] };
    const source = { list: [3] };
    const result = deepMerge(target as any, source as any);
    expect(result).toEqual({ list: [3] });
  });

  it('handles null in source (overwrites)', () => {
    const target = { a: { x: 1 } };
    const source = { a: null as any };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: null });
  });

  it('handles undefined in source (sets undefined)', () => {
    const target = { a: 1, b: 2 as number | undefined };
    const source = { b: undefined };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: undefined });
    expect('b' in result).toBe(true);
  });

  it('overwrites object with primitive and vice versa', () => {
    expect(deepMerge({ a: { x: 1 } } as any, { a: 5 } as any)).toEqual({ a: 5 });
    expect(deepMerge({ a: 5 } as any, { a: { x: 1 } } as any)).toEqual({ a: { x: 1 } });
  });

  it('does not mutate the original target object', () => {
    const target = { a: { x: 1 }, b: 2 };
    const copy = JSON.parse(JSON.stringify(target));
    const source = { a: { x: 10 }, c: 3 };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: { x: 10 }, b: 2, c: 3 });
    expect(target).toEqual(copy);
  });

  it('adds new keys from source', () => {
    const target = { a: 1 };
    const source = { b: { c: 2 }, a: 1 };
    expect(deepMerge(target, source)).toEqual({ a: 1, b: { c: 2 } });
  });
});
