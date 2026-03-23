import {
  checkTimeIsGreater,
  checkTimePassed,
  dateTimeToTimestamp,
  timestampToDateForReport,
  formatDateRange,
  getEpochAfterDays,
  getEpochInMiliseconds,
  formatEpochToDayMon,
  asUtcInTz,
  formatEpochInTz,
} from '@/lib/utils/date-utils';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// mock date-fns-tz to control behavior
jest.mock('date-fns-tz', () => ({
  toZonedTime: jest.fn(),
  formatInTimeZone: jest.fn(),
}));

describe('checkTimeIsGreater', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns true when changedTime is in the past', () => {
    const itemTime = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    expect(checkTimeIsGreater(itemTime, 5)).toBe(true);
  });

  it('returns false when changedTime is in the future', () => {
    const itemTime = Date.now();
    expect(checkTimeIsGreater(itemTime, 10)).toBe(false);
  });
});

describe('checkTimePassed', () => {
  it('returns true if now is greater than itemTime', () => {
    expect(checkTimePassed(Date.now() - 1000)).toBe(true);
  });

  it('returns false if itemTime is in the future', () => {
    expect(checkTimePassed(Date.now() + 1000)).toBe(false);
  });
});

describe('dateTimeToTimestamp', () => {
  it('converts a valid date-time string to timestamp', () => {
    const timestamp = dateTimeToTimestamp('2025-01-01T00:00:00Z');
    expect(timestamp).toBe(new Date('2025-01-01T00:00:00Z').getTime());
  });

  it('throws an error for invalid date string', () => {
    expect(() => dateTimeToTimestamp('invalid')).toThrow('Invalid date-time string');
  });
});

describe('timestampToDateForReport', () => {
  it('returns a formatted date string for valid timestamp', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    expect(timestampToDateForReport(date.getTime())).toContain('2025');
  });

  it('returns empty string for null or undefined', () => {
    expect(timestampToDateForReport(null as any)).toBe('');
    expect(timestampToDateForReport(undefined as any)).toBe('');
  });
});

describe('formatDateRange', () => {
  it('returns empty string if startTime or endTime is missing', () => {
    expect(formatDateRange(undefined, '2025-01-01')).toBe('');
    expect(formatDateRange('2025-01-01', undefined)).toBe('');
  });

  it('formats a valid date range with correct ordinal and month', () => {
    const start = '2025-01-02T10:00:00Z';
    const end = '2025-01-02T12:30:00Z';
    const result = formatDateRange(start, end, 'UTC');
    expect(result).toMatch(/2nd January, 2025/);
    expect(result).toMatch(/10:00 AM/);
    expect(result).toMatch(/12:30 PM/);
  });

  it('handles 1st, 2nd, 3rd, 11th, etc. correctly', () => {
    const samples = [
      ['2025-01-01T10:00Z', '2025-01-01T11:00Z', '1st'],
      ['2025-01-02T10:00Z', '2025-01-02T11:00Z', '2nd'],
      ['2025-01-03T10:00Z', '2025-01-03T11:00Z', '3rd'],
      ['2025-01-04T10:00Z', '2025-01-04T11:00Z', '4th'],
      ['2025-01-11T10:00Z', '2025-01-11T11:00Z', '11th'],
    ];

    for (const [start, end, ordinal] of samples) {
      const result = formatDateRange(start, end, 'UTC');
      expect(result).toContain(ordinal);
    }
  });
});

describe('getEpochAfterDays', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterAll(() => jest.useRealTimers());

  it('returns epoch after given days', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(getEpochAfterDays(1)).toBe(nowSec + 86400);
    expect(getEpochAfterDays(3)).toBe(nowSec + 3 * 86400);
  });
});

describe('getEpochInMiliseconds', () => {
  it('returns correct timestamp from date string', () => {
    const ts = getEpochInMiliseconds('2025-01-01T00:00:00Z');
    expect(ts).toBe(new Date('2025-01-01T00:00:00Z').getTime());
  });
});

describe('formatEpochToDayMon', () => {
  it('formats epoch to day-month string', () => {
    const epoch = new Date('2025-01-05T00:00:00Z').getTime();
    const result = formatEpochToDayMon(epoch);
    expect(result).toBe('05-Jan');
  });
});

describe('asUtcInTz', () => {
  it('calls toZonedTime with correct params and returns timestamp', () => {
    const mockDate = new Date('2025-01-01T00:00:00Z');
    (toZonedTime as jest.Mock).mockReturnValue(mockDate);
    const result = asUtcInTz('2025-01-01T00:00:00Z', 'Asia/Yerevan');
    expect(toZonedTime).toHaveBeenCalledWith('2025-01-01T00:00:00Z', 'Asia/Yerevan');
    expect(result).toBe(mockDate.getTime());
  });
});

describe('formatEpochInTz', () => {
  it('calls formatInTimeZone with correct params', () => {
    const date = new Date('2025-01-01T12:00:00Z');
    (formatInTimeZone as jest.Mock).mockReturnValue('formatted');
    const result = formatEpochInTz(date, 'Asia/Yerevan', 'M/d/yyyy');
    expect(formatInTimeZone).toHaveBeenCalledWith(date, 'Asia/Yerevan', 'M/d/yyyy');
    expect(result).toBe('formatted');
  });
});
