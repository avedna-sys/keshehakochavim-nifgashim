import isoCountries from 'i18n-iso-countries';
import hebrew from 'i18n-iso-countries/langs/he.json' with { type: 'json' };
isoCountries.registerLocale(hebrew);

// ISO 3166-1 countries and dependent territories; XK is used by GeoNames for Kosovo.
export const countries = Object.keys(isoCountries.getAlpha2Codes()).map(code => ({
  code,
  name: isoCountries.getName(code, 'he'),
  aliases: isoCountries.getName(code, 'he', { select: 'all' }),
}));
if (!countries.some(country => country.code === 'XK')) {
  countries.push({ code: 'XK', name: 'קוסובו', aliases: ['קוסובו'] });
}
countries.sort((a, b) => a.name.localeCompare(b.name, 'he'));
const normalize = value => value.normalize('NFKC').replace(/[\u0591-\u05c7"'״׳.]/g, '').trim().toLocaleLowerCase('he');
export function findCountry(value) {
  const query = normalize(value);
  return countries.find(country => normalize(country.code) === query ||
    [country.name, ...country.aliases].some(name => normalize(name) === query)) ?? null;
}
