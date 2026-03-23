import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { format, isValid, parse } from 'date-fns';
import { ReportUtcFinderRange } from '../controllers/reports';

export function checkTimeIsGreater(itemTime: number, addMinutes: number): boolean {
  const now = Date.now();
  const changedTime = itemTime + addMinutes * 60 * 1000;
  return changedTime <= now;
}

export function checkTimePassed(itemTime: number): boolean {
  const now = Date.now();
  return now - itemTime > 0;
}

export function dateTimeToTimestamp(dateTimeString: string) {
  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date-time string');
  }

  const timestamp = date.getTime();

  return timestamp;
}
export function timestampToDateForReport(date?: number) {
  if (date == null) return '';

  return new Date(date).toString();
}

export function formatDateRange(startTime?: string, endTime?: string, timeZone?: string): string {
  if (startTime == null || endTime == null) return '';

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // Function to add ordinal suffix (e.g., "16th", "1st")
  const formatOrdinal = (day: number) => {
    if (day > 3 && day < 21) return day + 'th'; // Handle 11th-13th as special cases
    switch (day % 10) {
      case 1:
        return day + 'st';
      case 2:
        return day + 'nd';
      case 3:
        return day + 'rd';
      default:
        return day + 'th';
    }
  };

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  // Format the date components using the formatter
  const [{ value: month }, , { value: day }, , { value: year }] = dateFormatter.formatToParts(startDate);

  // DateTimeFormat for formatting time with AM/PM
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC', // Use provided timezone or default to 'UTC'
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Month names array for conversion
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Get day with ordinal suffix
  const dayWithOrdinal = formatOrdinal(Number(day));
  const monthName = monthNames[Number(month) - 1];

  // Format start and end time using Intl.DateTimeFormat
  const startTimeFormatted = timeFormatter.format(startDate);
  const endTimeFormatted = timeFormatter.format(endDate);

  // Return the final formatted string
  return `${dayWithOrdinal} ${monthName}, ${year} ${startTimeFormatted} – ${endTimeFormatted}`;
}
export function getEpochAfterDays(days: number): number {
  const currentEpoch = Math.floor(Date.now() / 1000); // Current time in seconds
  const secondsInADay = 86400; // Number of seconds in a day (24 * 60 * 60)
  return currentEpoch + days * secondsInADay;
}
export function getEpochInMiliseconds(dateString: string): number {
  return new Date(dateString).getTime();
}
export function formatEpochToDayMon(epoch: number): string {
  const date = new Date(epoch);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${day}-${month}`;
}

export function asUtcInTz(date: string, timezone: string): number {
  return toZonedTime(date, timezone).getTime();
}

export function formatEpochInTz(epochMs: Date, timezone: string, pattern = 'M/d/yyyy, h:mm:ss a'): string {
  return formatInTimeZone(epochMs, timezone, pattern);
}

const hasTimePart = (s: string) => /[T ]\d{2}:\d{2}(:\d{2})?$/.test(s);

function normalizeDateOrDateTime(input: string, bound: 'start' | 'end'): string {
  if (!input) throw new Error('Empty date string');

  // If it already has time -> try to parse and normalize to ISO-with-seconds
  if (hasTimePart(input)) {
    const candidates = [
      "yyyy-MM-dd'T'HH:mm:ss",
      "yyyy-MM-dd' 'HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm",
      "yyyy-MM-dd' 'HH:mm",
      'dd-MM-yyyy HH:mm:ss',
      'dd-MM-yyyy HH:mm',
    ];

    for (const fmt of candidates) {
      const d = parse(input, fmt, new Date());
      if (isValid(d)) return format(d, "yyyy-MM-dd'T'HH:mm:ss");
    }
    throw new Error(`Invalid datetime: "${input}"`);
  }

  // Date-only ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const time = bound === 'start' ? '00:00:00' : '23:59:59';
    return `${input}T${time}`;
  }

  // Date-only EU: DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    const d = parse(input, 'dd-MM-yyyy', new Date());
    if (!isValid(d)) throw new Error(`Invalid date: "${input}"`);
    const isoDate = format(d, 'yyyy-MM-dd');
    const time = bound === 'start' ? '00:00:00' : '23:59:59';
    return `${isoDate}T${time}`;
  }

  throw new Error(`Unrecognized date format: "${input}"`);
}

export function toUtcRangeFlexible(startInput: string, endInput: string, tz = 'America/New_York') {
  const startNorm = normalizeDateOrDateTime(startInput, 'start'); // add 00:00:00 if date-only
  const endNorm = normalizeDateOrDateTime(endInput, 'end'); // add 23:59:59 if date-only
  return timezonedDateTimeRangeToUtc(startNorm, endNorm, tz);
}

function timezonedDateTimeRangeToUtc(startStr: string, endStr: string, tz = 'America/New_York'): ReportUtcFinderRange {
  const startUtc = fromZonedTime(parse(startStr, "yyyy-MM-dd'T'HH:mm:ss", new Date()), tz).getTime();

  const endUtcExclusive = fromZonedTime(parse(endStr, "yyyy-MM-dd'T'HH:mm:ss", new Date()), tz);
  const endUtc = endUtcExclusive.getTime() + 1000;

  return { startUtc, endUtc };
}
