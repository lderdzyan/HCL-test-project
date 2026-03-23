export function isValidArray<T>(arr: T[] | null | undefined): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = (target as any)[key];

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      (output as any)[key] = deepMerge(targetValue, sourceValue);
    } else {
      (output as any)[key] = sourceValue;
    }
  }

  return output;
}
