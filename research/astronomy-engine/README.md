# מנוע סינסטרי ניסיוני — Astronomy Engine

הניסוי שוחזר מחדש בענף `research/astronomy-engine`. אין לו חיבור ל־`src/`, ל־`public/` או לבניית Vite. נוספה תצוגת דפדפן נפרדת לשני גלגלים והיבטים; הוראות ב־BROWSER_DEMO.md. אין להציג פלט לציבור כמאומת לשימוש מקצועי.

## התקנה והרצה מתוך תיקייה זו

```sh
npm ci --cache /tmp/synastry-npm-cache
npm run reference:prepare
npm run tzdb:prepare
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

נדרשת שעה ידועה עם שניות ו־Z. אין לנחש שעה חסרה או להתייחס לתאריך מקומי כאל UTC. טווח Gregorian 1800–2026 בלבד. `dut1Seconds` הוא UT1−UTC (ברירת מחדל 0, הנחה מפורשת), ו־`deltaTSeconds` הוא TT−UT1 (ברירת מחדל מודל Astronomy Engine). לפני קיום UTC זו מוסכמת ייצוג בלבד, לא אישור היסטורי. בקווי רוחב מעבר לחוג הקוטב Placidus נדחה ללא fallback. ליבת הכוכבים אינה ממירה זמן מקומי; שכבת IANA הנפרדת מתוארת בהמשך.

## רישוי

Astronomy Engine 2.1.19 ברישיון MIT; נוסח הרישיון ב־`ASTRONOMY_ENGINE_LICENSE.txt`, ממקור הפרויקט בקומיט `61dc07020aaa6885d2c7f688a4d82beaf6edb9ef`. הקוד החדש אינו מעתיק קוד Swiss. `sweph` ונתוני Swiss הם כלי ייחוס בלבד, עם רישיונות נפרדים (יש לעיין בתנאיהם לפני כל הפצה/שילוב). אין להציג את תיקיית הניסוי כולה כקוד MIT בלבד.

## שכבת זמן היסטורי משוחזרת — ניסוי נפרד

`historical-time.mjs` מקבל את `data/tzdb-2026b.json`, מסד IANA מלא כולל `backzone`, ללא תלות ב־Intl/ICU. מסד הנתונים נשמר בענף המחקר ואינו מצורף לבניית האתר. המרה שומרת היסטים בשניות, מזהה כפילויות ופערים ואינה בוחרת שעה אוטומטית. הפונקציה `requireUnique` חוסמת קלט עמום/חסר.

```js
import {readFileSync} from 'node:fs';
import {createHistoricalTimeResolver} from './historical-time.mjs';
const data = JSON.parse(readFileSync(new URL('./data/tzdb-2026b.json', import.meta.url)));
const time = createHistoricalTimeResolver(data);
const result = time.resolve('1930-01-01', '12:00', 'Europe/Amsterdam');
// resolved: 1930-01-01T11:40:28Z, offsetSeconds: 1172
```

לשחזור נתוני הייחוס ולהרצת **כל** בדיקות הניסוי:

```sh
npm ci --cache /tmp/synastry-npm-cache
npm run reference:prepare
npm run tzdb:prepare
npm test
node validation/write-report.mjs
npm run report:time
```

הכנת TZDB דורשת `curl`, `tar`, `make`, `awk`, ו־`zic` התומך ב־`-R`; בדיקות ההשוואה דורשות Python 3.9+ עם ZoneInfo והתקנת tzdata של המערכת. נתוני המקור נבדקים ב־SHA-256. כל קומפילציה נוצרת בתיקייה חדשה מוחרגת, בלי לדרוס עבודת מחקר קיימת. לצורך שימוש בממיר בלבד אין צורך בכלי הבנייה או ב־Python. בשימוש בדפדפן ניתן להזין JSON לממיר, אך הוא עדיין לא חובר לאתר.

[דוח הזמן החדש](HISTORICAL_TIME_REPORT.md) נפרד מדוח הכוכבים והבתים. הבדיקות מאמתות המרה מול IANA ולא מהוות אימות עצמאי של החוקים ההיסטוריים לכל מקום. UT1/TT והכרעת אזור זמן לפי מיקום עדיין דורשים טיפול. אין העברה אוטומטית של קלט מקומי למנוע הכוכבים.

## צמתי הירח — חלק מאומת נפרד וחקירת True Node

`verified/mean-node.mjs` מחשב **Mean Node בלבד**, כולל זנב ב־180° מהראש. הוא עבר השוואה עצמאית מול Swiss ב־6,018 מועדים בשנים 1800–2026. אינו מחובר אוטומטית ל־`engine.mjs` או לאפליקציה; משתמשים בו ישירות עם `AstroTime` של TT ידוע.

```js
import * as Astronomy from 'astronomy-engine';
import {calculateMeanLunarNodes} from './verified/mean-node.mjs';
const nodes = calculateMeanLunarNodes(Astronomy.MakeTime(new Date('2000-01-01T12:00:00Z')));
```

**True Node עדיין נכשל בסף 0.005°, שלא הוגדל.** חקירת הזמן, המסגרת והגדרת הצומת מצביעה על וקטור מצב הירח של Astronomy Engine כמקור העיקרי להפרש. תיקון מוסכמת זמן האור במועמד המקומי לא פתר אותו. המועמד, הבדיקות הכושלות וקובצי העבודה הקודמים נשמרו מקומית תחת `local-investigations/true-node/`, מוחרגים מ־Git, ואינם חלק מהמודול המאומת.

```sh
npm test
node validation/node-cause.probe.mjs
node validation/write-node-cause-report.mjs
# בדיקת המועמד המקומי בלבד — צפויה להיכשל בסף True:
node --test local-investigations/true-node/validation/lunar-nodes.check.mjs
```

הצלחת `npm test` אינה אישור ל־True Node: היא בודקת את המנוע הקיים, הזמן ואת Mean בלבד. [NODE_CAUSE_REPORT.md](NODE_CAUSE_REPORT.md) כולל את שלושת המועדים, בידוד גורמי ההפרש, ההרצה החוזרת לאחר שינוי מוסכמת זמן האור והעבודה שטרם אומתה. עדות הכישלון נשמרת בענף כנתונים בלבד, לא כקוד חישוב מאושר.

## Mean Black Moon Lilith — מודול נפרד מאומת בדגימה

`verified/mean-lilith.mjs` מחשב את **האפוגיאה הממוצעת של הירח**, עם אורך ורוחב אקליפטיים גאוצנטריים טרופיים. הוא אינו מחשב לילית אוסצולטורית, אפוגיאה אינטרפולטיבית או אסטרואיד 1181 Lilith. סף ההשוואה שנקבע מראש הוא 0.001° לאורך, לרוחב ולהפרדה הזוויתית הכוללת. המודול מבודד ואינו מחובר לאפליקציה הציבורית או ל־engine.mjs.

```js
import * as Astronomy from 'astronomy-engine';
import {calculateMeanBlackMoonLilith} from './verified/mean-lilith.mjs';
const lilith = calculateMeanBlackMoonLilith(Astronomy.MakeTime(new Date('2000-01-01T12:00:00Z')));
```

```sh
node --test validation/mean-lilith.check.mjs
node validation/write-lilith-report.mjs
```

[MEAN_LILITH_REPORT.md](MEAN_LILITH_REPORT.md) מפרט הרצה חדשה מול Swiss MEAN_APOG בשנים 1800–2026, כולל דגימה יומית של כל התקופה, שני מצבי ΔT, הפרשים ומספר השוואות שעברו/נכשלו. `npm test` כולל את בדיקות לילית. השוואת לילית הממוצעת אינה אישור ל־True Node או ללילית האוסצולטורית, ואינה משנה את מצבם המתועד.

## פתיחת מפת הסינסטרי הניסיונית

```sh
npm run dev:chart
```

פותחים http://localhost:5174/ (בענן: Preview של פורט 5174). לתצוגת בנייה: `npm run build:chart` ואז `npm run preview:chart`, בפורט 4174. זהו ממשק מחקר נפרד, עם פרטי לידה לשניים, שני גלגלים, בתים וצירים, היבטים וטבלת אורבים; האתר הציבורי אינו משתנה. [הוראות ומגבלות מלאות](BROWSER_DEMO.md).

ליצירת קובץ תצוגה יחיד: אחרי הבנייה מריצים `npm run export:chart`; מתקבל `browser-dist/synastry-preview.html`. הוראות ותוצאות הבדיקה שלו מפורטות ב־BROWSER_DEMO.md.
