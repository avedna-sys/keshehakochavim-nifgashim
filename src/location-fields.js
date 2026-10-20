import { countries, findCountry } from './countries.js';
import { locationLabel, searchCities } from './birth-location.js';

export function attachLocationFields(id) {
  const countryInput = document.getElementById(`${id}-country`);
  const cityInput = document.getElementById(`${id}-place`);
  const cityList = document.getElementById(`${id}-cities`);
  const status = document.getElementById(`${id}-location-status`);
  const countryList = document.getElementById(`${id}-countries`);
  for (const country of countries) {
    const option = document.createElement('option');
    option.value = country.name; countryList.append(option);
  }
  let locations = [], selected = null, timer, controller, revision = 0;
  const message = text => { status.textContent = text; };
  const select = location => {
    selected = location;
    cityInput.setCustomValidity('');
    message(`נבחרה עיר במדינה המבוקשת. אזור זמן: ${location.timeZone}.`);
  };
  const invalidate = () => {
    clearTimeout(timer); controller?.abort(); revision++;
    selected = null; locations = []; cityList.replaceChildren();
    cityInput.setCustomValidity('יש לבחור עיר מתוצאות החיפוש.');
  };
  const schedule = () => {
    invalidate();
    const country = findCountry(countryInput.value);
    countryInput.setCustomValidity(country ? '' : 'יש לבחור מדינה מהרשימה.');
    if (!country) { message('בחרו מדינה כדי לחפש עיר לידה.'); return; }
    const query = cityInput.value.trim();
    if (query.length < 2) { message('הקלידו לפחות שתי אותיות בעיר הלידה ובחרו תוצאה.'); return; }
    const currentRevision = revision;
    message('מחפש ערים במדינה שנבחרה…');
    timer = setTimeout(async () => {
      controller = new AbortController();
      try {
        const results = await searchCities(query, country.code, { signal: controller.signal });
        if (currentRevision !== revision) return;
        locations = results;
        for (const location of results) {
          const option = document.createElement('option'); option.value = locationLabel(location); option.label = `${location.name} — ${query}`; cityList.append(option);
        }
        message(results.length ? 'בחרו את העיר מהרשימה; בדקו גם את המחוז כדי להבחין בין ערים בעלות שם זהה.' : 'לא נמצאה עיר. נסו איות אחר או שם באנגלית.');
      } catch (error) {
        if (currentRevision !== revision || error.name === 'AbortError') return;
        message('לא ניתן לחפש ערים כרגע. בדקו את החיבור ונסו שוב; לא ייעשה שימוש במיקום משוער.');
      }
    }, 450);
  };
  cityInput.addEventListener('input', () => {
    const match = locations.find(location => locationLabel(location) === cityInput.value);
    if (match) { clearTimeout(timer); controller?.abort(); revision++; select(match); }
    else schedule();
  });
  countryInput.addEventListener('input', () => {
    if (selected) cityInput.value = '';
    schedule();
  });
  countryInput.addEventListener('change', () => {
    const country = findCountry(countryInput.value);
    if (country) countryInput.value = country.name;
  });
  schedule();
  return {
    getLocation: () => selected ? { ...selected } : null,
    // Explicit research reference input, never an automatic geocoding fallback.
    setReferenceLocation(location) {
      const country=countries.find(c=>c.code===location.countryCode);
      if(!country||!Number.isFinite(location.latitude)||Math.abs(location.latitude)>90||!Number.isFinite(location.longitude)||Math.abs(location.longitude)>180||!location.timeZone?.includes('/'))throw new Error('מיקום הבדיקה אינו תקין.');
      invalidate();countryInput.value=country.name;countryInput.setCustomValidity('');
      const value={...location,source:'Research reference coordinates (not a live geocoding result)'};
      locations=[value];cityInput.value=locationLabel(value);select(value);
      message(`מיקום ייחוס לבדיקת המחקר בלבד. אזור זמן: ${value.timeZone}.`);
    },
  };
}
