import { DateTime } from 'luxon';

const FALLBACK_MESSAGE_PREFIX = '[dateSerializer]';

const getUserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    console.warn(`${FALLBACK_MESSAGE_PREFIX} Unable to determine user timezone:`, error);
    return 'UTC';
  }
};

const isCalendarLike = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const hasCalendarGetters =
    typeof value.year === 'function' &&
    typeof value.month === 'function' &&
    typeof value.date === 'function';

  if (!hasCalendarGetters) {
    return false;
  }

  const looksLikeDayjs = typeof value.isValid === 'function' && typeof value.toDate === 'function';
  const looksLikeMoment = value._isAMomentObject === true;

  return looksLikeDayjs || looksLikeMoment;
};

const buildDateTimeFromCalendar = (value, { includeTime }) => {
  if (typeof value.isValid === 'function' && !value.isValid()) {
    return null;
  }

  const components = {
    year: value.year(),
    month: value.month() + 1,
    day: value.date(),
    hour: includeTime && typeof value.hour === 'function' ? value.hour() : 0,
    minute: includeTime && typeof value.minute === 'function' ? value.minute() : 0,
    second: includeTime && typeof value.second === 'function' ? value.second() : 0,
    millisecond:
      includeTime && typeof value.millisecond === 'function' ? value.millisecond() : 0
  };

  const dt = DateTime.fromObject(components, { zone: 'utc' });
  return dt.isValid ? dt : null;
};

const coerceIsoString = (input) => {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof Date && !Number.isNaN(input.valueOf())) {
    return input.toISOString();
  }

  if (typeof input.toISOString === 'function') {
    try {
      return input.toISOString();
    } catch (error) {
      console.warn(`${FALLBACK_MESSAGE_PREFIX} Failed to convert value with toISOString():`, error);
      return null;
    }
  }

  return null;
};

const normalizeFromIsoString = (isoInput, { includeTime }) => {
  if (!isoInput) {
    return null;
  }

  const dt = DateTime.fromISO(isoInput, { setZone: true });

  if (!dt.isValid) {
    return null;
  }

  if (includeTime) {
    return dt.toUTC();
  }

  const userZone = getUserTimeZone();
  const calendarDate = dt.setZone(userZone);

  return DateTime.fromObject(
    {
      year: calendarDate.year,
      month: calendarDate.month,
      day: calendarDate.day
    },
    { zone: 'utc' }
  );
};

const normalizeDateInput = (input, options = { includeTime: false }) => {
  if (isCalendarLike(input)) {
    return buildDateTimeFromCalendar(input, options);
  }

  const isoInput = coerceIsoString(input);
  return normalizeFromIsoString(isoInput, options);
};

export const serializeDateToUtc = (input) => {
  const normalized = normalizeDateInput(input, { includeTime: false });

  if (!normalized) {
    if (input) {
      console.warn(`${FALLBACK_MESSAGE_PREFIX} Unable to normalize date input:`, input);
    }
    return null;
  }

  return normalized.startOf('day').toISO();
};

export const serializeDateTimeToUtc = (input) => {
  const normalized = normalizeDateInput(input, { includeTime: true });

  if (!normalized) {
    if (input) {
      console.warn(`${FALLBACK_MESSAGE_PREFIX} Unable to normalize datetime input:`, input);
    }
    return null;
  }

  return normalized.toISO();
};

export default serializeDateToUtc;
