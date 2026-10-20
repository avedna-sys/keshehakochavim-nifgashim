# מנוע סינסטרי ניסיוני — Astronomy Engine

הניסוי שוחזר מחדש בענף `research/astronomy-engine`. אין לו חיבור ל־`src/`, ל־`public/` או לבניית Vite. אין בשלב זה חישוב היבטים או הצגת מפה. אין להציג פלט לציבור כמאומת לשימוש מקצועי.

## התקנה והרצה מתוך תיקייה זו

```sh
npm ci --cache /tmp/synastry-npm-cache
npm run reference:prepare
npm test
node validation/write-report.mjs
```

נדרשים Node.js 24 ו־curl; כלי הייחוס `sweph` הוא מודול native, ובמערכת ללא binary מתאים עשויים להידרש כלי בנייה. ארבעת קובצי האפמריס מורדים ממקור Swiss הרשמי ב־GitHub, מקובעים לקומיט ונבדקים ב־SHA-256. קובצי הנתונים ו־node_modules נשארים מקומיים ומוחרגים מ־Git. נתונים חסרים/פגומים או מעבר Swiss למנוע חלופי גורמים לכישלון, לא לדילוג שקט. דוח ה־Markdown נוצר מקובץ JSON של הרצה חדשה; אין למחזר דוח כהוכחה להרצה אחרת.

## היקף

- `engine.mjs`: עשרת גרמי השמיים Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto; אורך טרופי 0–360°, שם מזל בעברית ומעלה במזל, רוחב ומרחק גאוצנטריים.
- `placidus.mjs`: ASC, DSC, MC, IC ו־12 קצוות בתי Placidus; נוסחאות עצמאיות ופתרון מספרי, ללא קוד Swiss בתוך המנוע.
- `validation/contracts.check.mjs`: אימות קלט, גבולות מזלות, מבנה בתים, דחיית אזורי קוטב, סולמות זמן והיעדר מצב משותף.
- `validation/reference.check.mjs`: השוואה מחודשת מול Swiss Ephemeris, נתונים ו־flags מאומתים, דגימת 1800–2026. שמות הבדיקות אינם `.test.*` כדי שלא ייכנסו לבדיקות האפליקציה בטעות.
- `VALIDATION_REPORT.md` ו־`validation/results.json`: תוצאות ההרצה שנערכה בסביבה זו; כולל הפרשים במעלות, דוגמאות מיקומים ובתים, ושיאי שגיאה עם מועדים.

```js
import {calculateNatal} from './engine.mjs';
const experimental = calculateNatal({
  utc: '2000-01-01T12:00:00Z',
  latitude: 31.7683,
  longitude: 35.2137,
});
```

נדרשת שעה ידועה עם שניות ו־Z. אין לנחש שעה חסרה או להתייחס לתאריך מקומי כאל UTC. טווח Gregorian 1800–2026 בלבד. `dut1Seconds` הוא UT1−UTC (ברירת מחדל 0, הנחה מפורשת), ו־`deltaTSeconds` הוא TT−UT1 (ברירת מחדל מודל Astronomy Engine). לפני קיום UTC זו מוסכמת ייצוג בלבד, לא אישור היסטורי. בקווי רוחב מעבר לחוג הקוטב Placidus נדחה ללא fallback. אין כאן שחזור של שכבת IANA TZDB או טיפול בשעות כפולות/חסרות.

## רישוי

Astronomy Engine 2.1.19 ברישיון MIT; נוסח הרישיון ב־`ASTRONOMY_ENGINE_LICENSE.txt`, ממקור הפרויקט בקומיט `61dc07020aaa6885d2c7f688a4d82beaf6edb9ef`. הקוד החדש אינו מעתיק קוד Swiss. `sweph` ונתוני Swiss הם כלי ייחוס בלבד, עם רישיונות נפרדים (יש לעיין בתנאיהם לפני כל הפצה/שילוב). אין להציג את תיקיית הניסוי כולה כקוד MIT בלבד.
