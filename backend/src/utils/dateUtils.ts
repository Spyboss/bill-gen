import { DateTime } from 'luxon';

export function parseUtcDate(input: unknown, field: string): Date {
  if (!input) {
    return DateTime.utc().startOf('day').toJSDate();
  }

  if (typeof input !== 'string') {
    console.warn(`${field}: non-string date, using current UTC`);
    return DateTime.utc().startOf('day').toJSDate();
  }

  const dt = DateTime.fromISO(input, { zone: 'utc' });

  if (!dt.isValid) {
    console.warn(`${field}: invalid date ${input}, using current UTC`);
    return DateTime.utc().startOf('day').toJSDate();
  }

  return dt.startOf('day').toJSDate();
}
