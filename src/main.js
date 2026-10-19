import './style.css';
import { prepareRequest, relationshipTypes } from './synastry.js';

const logo = '<img class="zodiac" src="/logo.svg" alt="כשהכוכבים נפגשים — גלגלי מזלות צבעוניים עם כוכב זהוב בנקודת המפגש" width="360" height="204">';
const fields = (id, title, symbol) => `<fieldset class="person"><legend><span class="person-symbol" aria-hidden="true">${symbol}</span>${title}</legend><label for="${id}-name">שם מלא<input id="${id}-name" name="${id}-name" autocomplete="off" placeholder="איך קוראים לך?" required maxlength="100"></label><div class="field-row"><label for="${id}-date">תאריך לידה<input id="${id}-date" name="${id}-date" type="date" required max="${new Date().toISOString().slice(0,10)}"></label><label for="${id}-time">שעת לידה <span class="optional">(אם ידועה)</span><input id="${id}-time" name="${id}-time" type="time"></label></div><label for="${id}-place">מקום לידה<input id="${id}-place" name="${id}-place" placeholder="עיר או יישוב" required maxlength="150"></label><label for="${id}-country">מדינה<input id="${id}-country" name="${id}-country" placeholder="למשל, ישראל" required maxlength="100"></label></fieldset>`;
document.querySelector('#app').innerHTML = `
<header class="topbar"><div class="creator"><label class="avatar" for="creator-photo"><span id="avatar-placeholder" aria-hidden="true">✧</span><img id="creator-image" alt="עדנה אבני" hidden><span class="sr-only">העלאת תמונת היוצרת</span></label><div><span class="creator-label">נוצר ע&quot;י עדנה אבני</span><label class="upload-label" for="creator-photo">העלאת תמונה</label><input id="creator-photo" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp"></div></div><span class="top-note">מבט אל הקשר שבינינו <span aria-hidden="true">✦</span></span></header>
<main><section class="hero" aria-labelledby="title"><div class="eyebrow">שני עולמות. נקודת מפגש אחת.</div>${logo}<h1 id="title">כשהכוכבים נפגשים</h1><p class="subtitle">אסטרולוגיה של אהבה, משפחה וחברות</p><div class="ornament" aria-hidden="true"><span></span>✧<span></span></div><p class="intro">לכל אחד מאיתנו עולם שלם. מה קורה כשהעולמות נפגשים?<br>כאן מתחיל המסע להכיר את החיבור ביניכם דרך מפת השמיים.</p></section>
<section class="workspace" aria-labelledby="details-title"><div class="section-heading"><span class="step">01</span><div><h2 id="details-title">נתחיל בפרטי הלידה</h2><p>שני אנשים, שתי מפות, סיפור משותף אחד.</p></div><span class="phase">גרסה ראשונית</span></div><form id="birth-form"><div class="people">${fields('first','האדם הראשון','☉')}<div class="connection" aria-hidden="true">✧</div>${fields('second','האדם השני','☾')}</div><p class="time-note">אין שעת לידה מדויקת? אפשר להשאיר את השדה ריק. בהמשך, הדבר יגביל חישובים התלויים בשעה.</p><fieldset class="relationships"><legend>איזה קשר תרצו לחקור?</legend><div class="choices">${relationshipTypes.map((type,i)=>`<label><input type="radio" name="relationship" value="${type}" ${i===0?'checked':''}><span>${type}</span></label>`).join('')}</div></fieldset><div class="submit-area"><button type="submit">הצג מפת סינסטרי <span aria-hidden="true">✧</span></button><p>מנוע החישוב עדיין בפיתוח. בשלב זה לא תופק מפה אסטרולוגית.</p></div><p id="form-status" class="status" role="status" aria-live="polite" tabindex="-1"></p></form></section>
<section class="future" aria-labelledby="future-title"><div class="future-heading"><span class="eyebrow">בהמשך המסע</span><h2 id="future-title">מקום להכיר את החיבור לעומק</h2></div><div class="future-grid"><article><span class="future-icon" aria-hidden="true">◎</span><span class="badge">בפיתוח</span><h3>מפת סינסטרי כפולה</h3><p>שתי מפות לידה בגלגל משותף, למבט על נקודות המפגש ביניכם.</p></article><article><span class="future-icon" aria-hidden="true">✣</span><span class="badge">בפיתוח</span><h3>טבלת היבטים</h3><p>הזוויות והקשרים בין גרמי השמיים בשתי מפות הלידה.</p></article><article><span class="future-icon" aria-hidden="true">✧</span><span class="badge">בפיתוח</span><h3>פרשנות אסטרולוגית</h3><p>מילים בעברית שיעזרו להעמיק בהבנת הדינמיקה של הקשר.</p></article></div></section><p class="privacy">פרטי הלידה והתמונה נשארים בדפדפן בלבד ואינם נשלחים לשרת. הם לא נשמרים לאחר רענון.</p></main><footer><span>✦</span> כשהכוכבים נפגשים <span class="footer-dot">·</span> נוצר באהבה על ידי עדנה אבני</footer>`;

document.querySelector('#birth-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const person = id => Object.fromEntries(['name','date','time','place','country'].map(key => [key, String(data.get(`${id}-${key}`) || '').trim()]));
  const status = document.querySelector('#form-status');
  try {
    prepareRequest(person('first'), person('second'), data.get('relationship'));
    status.textContent = 'הפרטים תקינים. מפת הסינסטרי, טבלת ההיבטים והפרשנות עדיין בפיתוח. לא בוצע חישוב אסטרולוגי והפרטים לא נשמרו.';
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
