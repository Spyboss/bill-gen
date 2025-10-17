import { DateTime } from 'luxon';

const FALLBACK_MESSAGE_PREFIX = '[dateSerializer]';

function coerceIsoString(input) {
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

  console.warn(`${FALLBACK_MESSAGE_PREFIX} Unsupported date value provided:`, input);
  return null;
}

export const serializeDateToUtc = (input) => {
  const isoInput = coerceIsoString(input);

  if (!isoInput) {
    return null;
  }

  const dt = DateTime.fromISO(isoInput);

  if (!dt.isValid) {
    console.warn(`${FALLBACK_MESSAGE_PREFIX} Invalid ISO input received: ${isoInput}`);
    return DateTime.utc().startOf('day').toISO();
  }

  return dt.toUTC().startOf('day').toISO();
};

export const serializeDateTimeToUtc = (input) => {
  const isoInput = coerceIsoString(input);

  if (!isoInput) {
    return null;
  }

  const dt = DateTime.fromISO(isoInput);

  if (!dt.isValid) {
    console.warn(`${FALLBACK_MESSAGE_PREFIX} Invalid ISO input received: ${isoInput}`);
    return DateTime.utc().toISO();
  }

  return dt.toUTC().toISO();
};

export default serializeDateToUtc;
