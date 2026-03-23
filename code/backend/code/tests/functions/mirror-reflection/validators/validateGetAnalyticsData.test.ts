import { validateGetAnalyticsData } from '@/functions/mirror-reflection/validators/getAnalyticsData';
import * as TE from 'fp-ts/Either';

describe('validateGetAnalyticsData', () => {
  const cases = [
    {
      name: 'valid dates',
      dto: { startOfDate: 'Saturday, February 8, 2025 10:20:00 AM', endOfDate: 'Wednesday, June 4, 2025 6:52:03 AM' },
      expectError: false,
    },
    {
      name: 'startOfDate after endOfDate',
      dto: { startOfDate: 'Wednesday, June 4, 2025 6:52:03 AM', endOfDate: 'Saturday, February 8, 2025 10:20:00 AM' },
      expectError: true,
    },
    {
      name: 'missing dates',
      dto: {} as any,
      expectError: true,
    },
    {
      name: 'null dto',
      dto: null as any,
      expectError: true,
    },
  ];

  test.each(cases)('$name', async ({ dto, expectError }) => {
    const result = await validateGetAnalyticsData(dto)();

    expect(TE.isRight(result)).toBe(true);
    if (TE.isRight(result)) {
      expect(result.right.hasError()).toBe(expectError);
    }
  });
});
