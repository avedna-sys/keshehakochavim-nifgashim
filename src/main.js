import './style.css';
import { attachLocationFields } from './location-fields.js';
import { createBirthContext } from './birth-location.js';
import { prepareRequest, relationshipTypes } from './synastry.js';

const logo = '<img class="zodiac" src="/synastry-logo.png" alt="כשהכוכבים נפגשים — גלגלי מזלות צבעוניים עם כוכב זהוב בנקודת המפגש" width="1536" height="1024">';
const fields = (id, title, symbol) => `<fieldset class="person"><legend><span class="person-symbol" aria-hidden="true">${symbol}</span>${title}</legend><label for="${id}-name">שם מלא<input id="${id}-name" name="${id}-name" autocomplete="off" placeholder="איך קוראים לך?" required maxlength="100"></label><div class="field-row"><label for="${id}-date">תאריך לידה<input id="${id}-date" name="${id}-date" type="date" required max="${new Date().toISOString().slice(0,10)}"></label><label for="${id}-time">שעת לידה <span class="optional">(אם ידועה)</span><input id="${id}-time" name="${id}-time" type="time"></label></div><label for="${id}-place">מקום לידה<input id="${id}-place" name="${id}-place" placeholder="עיר או יישוב" list="${id}-cities" autocomplete="off" aria-describedby="${id}-location-status" required maxlength="250"><datalist id="${id}-cities"></datalist></label><label for="${id}-country">מדינה<input id="${id}-country" name="${id}-country" placeholder="חיפוש מדינה בעברית" list="${id}-countries" autocomplete="off" required maxlength="100"><datalist id="${id}-countries"></datalist></label><p id="${id}-location-status" class="time-note" role="status" aria-live="polite"></p></fieldset>`;
document.querySelector('#app').innerHTML = `
<header class="topbar"><div class="creator"><label class="avatar" for="creator-photo"><span id="avatar-placeholder" aria-hidden="true" hidden>✧</span><img id="creator-image" src="/creator-portrait.png" alt="עדנה אבני" width="1254" height="1254"><span class="sr-only">העלאת תמונת היוצרת</span></label><div><span class="creator-label">נוצר ע&quot;י עדנה אבני</span><input id="creator-photo" aria-label="החלפת תמונת היוצרת" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp"></div></div><span class="top-note">מבט אל הקשר שבינינו <span aria-hidden="true">✦</span></span></header>
<main><section class="hero" aria-labelledby="title"><div class="eyebrow">שני עולמות. נקודת מפגש אחת.</div>${logo}<h1 id="title">כשהכוכבים נפגשים</h1><p class="subtitle">אסטרולוגיה של אהבה, משפחה וחברות</p><div class="ornament" aria-hidden="true"><span></span>✧<span></span></div><p class="intro">לכל אחד מאיתנו עולם שלם. מה קורה כשהעולמות נפגשים?<br>כאן מתחיל המסע להכיר את החיבור ביניכם דרך מפת השמיים.</p></section>
<section class="workspace" aria-labelledby="details-title"><div class="section-heading"><span class="step">01</span><div><h2 id="details-title">נתחיל בפרטי הלידה</h2><p>שני אנשים, שתי מפות, סיפור משותף אחד.</p></div><span class="phase">גרסה ראשונית</span></div><form id="birth-form"><div class="people">${fields('first','האדם הראשון','☉')}<div class="connection" aria-hidden="true">✧</div>${fields('second','האדם השני','☾')}</div><p class="time-note">אין שעת לידה מדויקת? אפשר להשאיר את השדה ריק. בהמשך, הדבר יגביל חישובים התלויים בשעה.</p><fieldset class="relationships"><legend>איזה קשר תרצו לחקור?</legend><div class="choices">${relationshipTypes.map((type,i)=>`<label><input type="radio" name="relationship" value="${type}" ${i===0?'checked':''}><span>${type}</span></label>`).join('')}</div></fieldset><div class="submit-area"><button type="submit" aria-describedby="synastry-availability">צור מפת סינסטרי <span aria-hidden="true">✧</span></button><p id="synastry-availability">חישוב מפת סינסטרי עדיין אינו זמין. יצירת מפה תתאפשר רק לאחר חיבור מנוע חישוב מאומת ומורשה.</p></div><p id="form-status" class="status" role="status" aria-live="polite" tabindex="-1"></p></form></section>
<section class="future" aria-labelledby="future-title"><div class="future-heading"><span class="eyebrow">בהמשך המסע</span><h2 id="future-title">מקום להכיר את החיבור לעומק</h2></div><div class="future-grid"><article><span class="future-icon" aria-hidden="true">◎</span><span class="badge">בפיתוח</span><h3>מפת סינסטרי כפולה</h3><p>שתי מפות לידה בגלגל משותף, למבט על נקודות המפגש ביניכם.</p></article><article><span class="future-icon" aria-hidden="true">✣</span><span class="badge">בפיתוח</span><h3>טבלת היבטים</h3><p>הזוויות והקשרים בין גרמי השמיים בשתי מפות הלידה.</p></article><article><span class="future-icon" aria-hidden="true">✧</span><span class="badge">בפיתוח</span><h3>פרשנות אסטרולוגית</h3><p>מילים בעברית שיעזרו להעמיק בהבנת הדינמיקה של הקשר.</p></article></div></section><p class="privacy">לחיפוש מיקום נשלחים לשירות Open-Meteo רק שם העיר וקוד המדינה, ללא שם האדם, תאריך או שעת הלידה. הפרטים והתמונה אינם נשמרים לאחר רענון. נתוני מיקום: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> / <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a>.</p></main><footer><span>✦</span> כשהכוכבים נפגשים <span class="footer-dot">·</span> נוצר באהבה על ידי עדנה אבני</footer>`;

const locationFields = { first: attachLocationFields('first'), second: attachLocationFields('second') };

document.querySelector('#birth-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const person = id => Object.fromEntries(['name','date','time','place','country'].map(key => [key, String(data.get(`${id}-${key}`) || '').trim()]));
  const status = document.querySelector('#form-status');
  try {
    const request = prepareRequest(person('first'), person('second'), data.get('relationship'));
    request.people = request.people.map((details, index) => createBirthContext(details, locationFields[index === 0 ? 'first' : 'second'].getLocation()));
    // Engine integration boundary: request.people contains coordinates, IANA zone
    // and resolved historical UTC instant (or explicit unknown-time status).
    // No astronomical calculations are performed in this version.
    status.textContent = 'פרטי הלידה של שני האנשים תקינים. חישוב מפת סינסטרי עדיין אינו זמין, עד לחיבור מנוע חישוב מאומת ומורשה. לא נוצרה מפה, לא בוצע חישוב אסטרולוגי והפרטים לא נשמרו.';
  } catch (error) { status.textContent = error.message; }
  status.focus();
});
let imageUrl;
document.querySelector('#creator-photo').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.querySelector('#form-status');
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    status.textContent = 'יש לבחור תמונת JPG, PNG או WebP בגודל של עד 5 מגה־בייט.';
    status.focus(); event.target.value = ''; return;
  }
  const image = document.querySelector('#creator-image');
  const nextUrl = URL.createObjectURL(file);
  image.onload = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = nextUrl; image.hidden = false;
    document.querySelector('#avatar-placeholder').hidden = true;
  };
  image.onerror = () => { URL.revokeObjectURL(nextUrl); status.textContent = 'לא ניתן לקרוא את התמונה. יש לבחור קובץ תמונה תקין.'; status.focus(); };
  image.src = nextUrl;
});
