import { Temporal } from '@js-temporal/polyfill';
import { countries, findCountry } from './countries.js';

export function normalizeLocation(result, countryCode) {
  if (!result || result.country_code !== countryCode || !Number.isInteger(result.id) ||
      !result.feature_code?.startsWith('PPL') || !result.name ||
      !Number.isFinite(result.latitude) || Math.abs(result.latitude) > 90 ||
      !Number.isFinite(result.longitude) || Math.abs(result.longitude) > 180 ||
      !result.timezone?.includes('/')) return null;
  try { Temporal.Now.zonedDateTimeISO(result.timezone); } catch { return null; }
  return {
    id: String(result.id), name: result.name, region: result.admin1 || '',
    countryCode, latitude: result.latitude, longitude: result.longitude,
    timeZone: result.timezone, source: 'GeoNames via Open-Meteo',
  };
}

export function locationLabel(location) {
  return `${location.name}${location.region ? ` — ${location.region}` : ''} (${location.latitude}, ${location.longitude})`;
}

export async function searchCities(query, countryCode, { signal, fetcher = fetch } = {}) {
  if (!countries.some(country => country.code === countryCode) || query.trim().length < 2) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: query.trim(), countryCode, language: 'he', count: '20', format: 'json' });
  const response = await fetcher(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), credentials: 'omit' });
  if (!response.ok) throw new Error('שירות חיפוש הערים אינו זמין כרגע. נסו שוב מאוחר יותר.');
  const data = await response.json();
  if (data.error || (data.results !== undefined && !Array.isArray(data.results))) {
    throw new Error('שירות חיפוש הערים החזיר תשובה לא תקינה.');
  }
  const seen = new Set();
  return (data.results || []).map(result => normalizeLocation(result, countryCode)).filter(location => {
    if (!location || seen.has(location.id)) return false;
    seen.add(location.id); return true;
  });
}

// Interpret the entered local civil time using historical IANA rules, NOT today's
// UTC offset. Never guess an instant for unknown, nonexistent or repeated times.
export function resolveBirthTime(date, time, timeZone) {
  if (!time) return { status: 'unknown-time', instant: null, offset: null, timeZone };
  const local = Temporal.PlainDateTime.from(`${date}T${time}`);
  const earlier = local.toZonedDateTime(timeZone, { disambiguation: 'earlier' });
  const later = local.toZonedDateTime(timeZone, { disambiguation: 'later' });
  if (!earlier.toPlainDateTime().equals(local) || !later.toPlainDateTime().equals(local)) {
    return { status: 'nonexistent', instant: null, offset: null, timeZone };
  }
  if (earlier.epochNanoseconds !== later.epochNanoseconds) {
    return { status: 'ambiguous', instant: null, offset: null, timeZone,
      candidates: [earlier, later].map(value => ({ instant: value.toInstant().toString(), offset: value.offset })) };
  }
  return { status: 'resolved', instant: earlier.toInstant().toString(), offset: earlier.offset, timeZone };
}

export function createBirthContext(person, location) {
  if (!location) throw new Error('יש לבחור עיר מתוצאות החיפוש עבור שני המשתתפים.');
  if (findCountry(person.country)?.code !== location.countryCode) {
    throw new Error('העיר שנבחרה אינה תואמת למדינה. יש לבחור אותה מחדש.');
  }
  const civilTime = resolveBirthTime(person.date, person.time, location.timeZone);
  if (civilTime.status === 'nonexistent') throw new Error('שעת הלידה אינה קיימת בתאריך זה עקב מעבר שעון. יש לבדוק את הרישום המקורי.');
  if (civilTime.status === 'ambiguous') throw new Error('שעת הלידה מופיעה פעמיים בתאריך זה עקב מעבר שעון. דרוש בירור של ההיסט המדויק לפני חישוב מפה.');
  return { ...person, location: { ...location }, civilTime };
}
