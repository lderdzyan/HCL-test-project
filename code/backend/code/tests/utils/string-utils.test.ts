import { getLastPathSegment, extractSubstringWithRegex } from '@/lib/utils/string-utils';

describe('getLastPathSegment', () => {
  it('returns the last segment of a standard URL', () => {
    const result = getLastPathSegment('https://example.com/path/to/resource');
    expect(result).toBe('resource');
  });

  it('handles trailing slashes correctly', () => {
    const result = getLastPathSegment('https://example.com/path/to/resource/');
    expect(result).toBe('resource');
  });

  it('returns empty string for root URL', () => {
    const result = getLastPathSegment('https://example.com/');
    expect(result).toBe('');
  });

  it('handles URL without any path segments', () => {
    const result = getLastPathSegment('https://example.com');
    expect(result).toBe('');
  });

  it('handles complex URL with query and hash', () => {
    const result = getLastPathSegment('https://example.com/a/b/c?x=1#section');
    expect(result).toBe('c');
  });

  it('handles URL with encoded characters', () => {
    const result = getLastPathSegment('https://example.com/some%20folder/file%20name');
    expect(result).toBe('file%20name');
  });

  it('throws a TypeError for invalid URL', () => {
    expect(() => getLastPathSegment('not-a-valid-url')).toThrow();
  });
});

describe('extractSubstringWithRegex', () => {
  it('extracts substrings between prefix and suffix', () => {
    const input = 'Hello [name] and [friend]!';
    const result = extractSubstringWithRegex(input, '\\[', '\\]');
    expect(result).toEqual(['name', 'friend']);
  });

  it('returns empty array when no matches found', () => {
    const input = 'No brackets here';
    const result = extractSubstringWithRegex(input, '\\[', '\\]');
    expect(result).toEqual([]);
  });

  it('handles overlapping patterns correctly (non-greedy)', () => {
    const input = 'A<one>B<two>C<three>';
    const result = extractSubstringWithRegex(input, '<', '>');
    expect(result).toEqual(['one', 'two', 'three']);
  });

  it('works with special characters in prefix/suffix', () => {
    const input = 'Start {{x}} middle {{y}} end';
    const result = extractSubstringWithRegex(input, '\\{\\{', '\\}\\}');
    expect(result).toEqual(['x', 'y']);
  });

  it('returns all matches even if prefix/suffix appear multiple times', () => {
    const input = '(a)(b)(c)';
    const result = extractSubstringWithRegex(input, '\\(', '\\)');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array when input string is empty', () => {
    const result = extractSubstringWithRegex('', '\\[', '\\]');
    expect(result).toEqual([]);
  });

  it('handles multiline strings correctly', () => {
    const input = 'First <x>\nSecond <y>';
    const result = extractSubstringWithRegex(input, '<', '>');
    expect(result).toEqual(['x', 'y']);
  });
});
