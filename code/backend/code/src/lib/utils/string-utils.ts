export function getLastPathSegment(urlString: string): string {
  try {
    const url = new URL(urlString);
    const pathname = url.pathname;
    const segments = pathname.split('/').filter((segment) => segment.length > 0);
    return segments.length > 0 ? segments[segments.length - 1] : '';
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

export function extractSubstringWithRegex(input: string, prefix: string, suffix: string): string[] {
  const regex = new RegExp(`${prefix}(.*?)${suffix}`, 'g');
  const matches = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}
