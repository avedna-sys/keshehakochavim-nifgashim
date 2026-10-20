import test from 'node:test';
import assert from 'node:assert/strict';
import { countries, findCountry } from '../src/countries.js';
import { searchCities, normalizeLocation, resolveBirthTime, createBirthContext } from '../src/birth-location.js';
const city = { id: 294801, name: 'חיפה', country_code: 'IL', admin1: 'מחוז חיפה', latitude: 32.81841, longitude: 34.9885, timezone: 'Asia/Jerusalem', feature_code: 'PPLA' };

test('complete country list, Hebrew names and aliases, unique stable country codes', () => {
  assert.equal(countries.length, 250);
  assert.equal(new Set(countries.map(c => c.code)).size, countries.length);
  for (const code of ['IL', 'US', 'RU', 'CN', 'IN', 'JP', 'BR', 'ZA', 'AU', 'AQ', 'PS', 'TW', 'XK']) {
    assert.ok(countries.some(c => c.code === code && /[א-ת]/.test(c.name)));
  }
  assert.equal(findCountry('ישראל').code, 'IL');
  assert.equal(findCountry('ארה״ב').code, 'US');
  assert.equal(findCountry('us').code, 'US');
  assert.equal(findCountry('לא מדינה'), null);
});
test('geocoding requests send only query and country, validate data and filter wrong-country results', async () => {
  let called = false;
  const cities = await searchCities('חיפה', 'IL', { fetcher: async (url, options) => {
    called = true;
    assert.equal(url.searchParams.get('language'), 'he');
    assert.equal(url.searchParams.get('countryCode'), 'IL');
    assert.equal(url.searchParams.get('name'), 'חיפה');
    assert.equal(options.credentials, 'omit');
    assert.deepEqual([...url.searchParams.keys()].sort(), ['count','countryCode','format','language','name'].sort());
    return { ok: true, json: async () => ({ results: [city, city, { ...city, id: 2, country_code: 'US' }, { ...city, id: 3, timezone: 'invalid' }, { ...city, id: 4, latitude: 200 }] }) };
  } });
  assert.ok(called);assert.equal(cities.length, 1);assert.equal(cities[0].timeZone, 'Asia/Jerusalem');
  assert.equal(cities[0].latitude, city.latitude);
  assert.equal(normalizeLocation({ ...city, timezone: null }, 'IL'), null);
});
test('geocoding handles empty results, API failure and malformed payloads without inventing a city', async () => {
  assert.deepEqual(await searchCities('חיפה', 'IL', { fetcher: async () => ({ ok: true, json: async () => ({}) }) }), []);
  await assert.rejects(searchCities('חיפה', 'IL', { fetcher: async () => ({ ok: false }) }));
  await assert.rejects(searchCities('חיפה', 'IL', { fetcher: async () => ({ ok: true, json: async () => ({ results: 'bad' }) }) }));
});
test('Israel historic DST rules use birth year, not current offset or a fixed country offset', () => {
  assert.equal(resolveBirthTime('2012-09-25', '12:00', 'Asia/Jerusalem').instant, '2012-09-25T10:00:00Z');
  assert.equal(resolveBirthTime('2013-09-25', '12:00', 'Asia/Jerusalem').instant, '2013-09-25T09:00:00Z');
  assert.equal(resolveBirthTime('2020-01-01', '12:00', 'Asia/Kathmandu').offset, '+05:45');
});
test('detects DST gaps, repeated times, skipped calendar dates and unknown time', () => {
  assert.equal(resolveBirthTime('2024-03-10', '02:30', 'America/New_York').status, 'nonexistent');
  const overlap = resolveBirthTime('2024-11-03', '01:30', 'America/New_York');
  assert.equal(overlap.status, 'ambiguous');assert.equal(overlap.candidates.length, 2);assert.equal(overlap.instant, null);
  assert.equal(resolveBirthTime('2011-12-30', '12:00', 'Pacific/Apia').status, 'nonexistent');
  assert.equal(resolveBirthTime('2020-01-01', '', 'Asia/Jerusalem').instant, null);
});
test('birth context carries coordinates and historical UTC for the engine; missing/ambiguous data blocks calculation', () => {
  const person = { name: 'עדנה', date: '2013-09-25', time: '12:00', place: 'חיפה', country: 'ישראל' };
  const location = normalizeLocation(city, 'IL');
  const context = createBirthContext(person, location);
  assert.equal(context.civilTime.instant, '2013-09-25T09:00:00Z');
  assert.equal(context.location.longitude, city.longitude);
  assert.throws(() => createBirthContext(person, null));
  assert.throws(() => createBirthContext({ ...person, country: 'ארצות הברית' }, location));
  assert.throws(() => createBirthContext({ ...person, date: '2024-11-03', time: '01:30' }, { ...location, timeZone: 'America/New_York' }));
});
