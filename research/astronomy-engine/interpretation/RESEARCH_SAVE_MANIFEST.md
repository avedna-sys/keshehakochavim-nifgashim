# שמירת מחקר כללי — שלבים א׳–ד׳

ענף: research/astronomy-engine. אין מיזוג, שינוי ב־main או חיבור לאתר. לא התחיל שלב ה׳.

נכללים מפרט וקטלוג הממצאים, שכבות הממצאים והתוכן הכלליות, מחוללי תקשורת ורגשות, תיקון שיוך הטענות, בדיקות ותיעוד. קובצי JSON ו־Markdown של שלושת זוגות הבדיקה הם מדגמים סינתטיים ונתוני ייחוס לרגרסיה, ולא נתונים של אנשים אמיתיים. הארכיונים נדרשים להשוואה לגרסאות קודמות; אינם יישום פעיל.

לא נכללים דוחות אישיים, קלט לידה פרטי, PDF, תמונות בדיקה, HTML שנוצר, בדיקות Solar Fire עם פרטי לידה, תוצאות בדיקות זמניות או שינויי תוצאות מחקר קודמים. התיקייה interpretation/private וכל קובצי הביקורת האישיים נשארים מקומית ומוחרגים מ־Git. אין כאן הבטחה למחיקת קבצים מהיסטוריה קיימת; ה־Commit הזה אינו מוסיף אותם.

## בדיקות ניתנות לשחזור

מתוך research/astronomy-engine, לאחר התקנת התלויות והכנת נתוני הייחוס כמוסבר בתיעוד המנוע:

```
node interpretation/general/build-examples.mjs
node interpretation/general/phase-d/build-review.mjs
node --test validation/general-interpretation.check.mjs validation/phase-d-synthesis.check.mjs validation/phase-d-attribution.check.mjs validation/relationship-review.check.mjs
node interpretation/general/phase-d/audit.mjs
node validation/phase-d-browser.mjs
```

הבדיקות והיצירה הכלליות פועלות גם בלי קבצים אישיים. במקרה כזה הבדיקה האישית מסומנת כדילוג, ואינה מוצגת כאילו בוצעה. קובצי HTML לתצוגה נוצרים מקומית מחדש. הגדרת CHROMIUM_PATH מאפשרת בחירת Chromium מותקן לבדיקות הדפדפן.

## רשימת קבצים מדויקת ב־Commit

- `research/astronomy-engine/.gitignore`
- `research/astronomy-engine/interpretation/facts.mjs`
- `research/astronomy-engine/interpretation/content.mjs`
- `research/astronomy-engine/interpretation/control-fixtures.mjs`
- `research/astronomy-engine/interpretation/review-render.mjs`
- `research/astronomy-engine/interpretation/swiss-house-audit.mjs`
- `research/astronomy-engine/interpretation/specification/01-professional-spec.md`
- `research/astronomy-engine/interpretation/specification/02-findings-coverage.md`
- `research/astronomy-engine/interpretation/general/README.md`
- `research/astronomy-engine/interpretation/general/REVISION_0_2_REVIEW.md`
- `research/astronomy-engine/interpretation/general/audit-repetition.mjs`
- `research/astronomy-engine/interpretation/general/build-examples.mjs`
- `research/astronomy-engine/interpretation/general/examples/case-1.json`
- `research/astronomy-engine/interpretation/general/examples/case-1.md`
- `research/astronomy-engine/interpretation/general/examples/case-2.json`
- `research/astronomy-engine/interpretation/general/examples/case-2.md`
- `research/astronomy-engine/interpretation/general/examples/case-3.json`
- `research/astronomy-engine/interpretation/general/examples/case-3.md`
- `research/astronomy-engine/interpretation/general/examples/comparison.json`
- `research/astronomy-engine/interpretation/general/examples/repetition-comparison.json`
- `research/astronomy-engine/interpretation/general/generate.mjs`
- `research/astronomy-engine/interpretation/general/history/phase-d-0.1/case-1.json`
- `research/astronomy-engine/interpretation/general/history/phase-d-0.1/case-2.json`
- `research/astronomy-engine/interpretation/general/history/phase-d-0.1/case-3.json`
- `research/astronomy-engine/interpretation/general/history/phase-d-0.1/compose.mjs`
- `research/astronomy-engine/interpretation/general/history/phase-d-0.1/interactions.mjs`
- `research/astronomy-engine/interpretation/general/history/v0.1/README.md`
- `research/astronomy-engine/interpretation/general/history/v0.1/case-1.json`
- `research/astronomy-engine/interpretation/general/history/v0.1/case-1.md`
- `research/astronomy-engine/interpretation/general/history/v0.1/case-2.json`
- `research/astronomy-engine/interpretation/general/history/v0.1/case-2.md`
- `research/astronomy-engine/interpretation/general/history/v0.1/case-3.json`
- `research/astronomy-engine/interpretation/general/history/v0.1/case-3.md`
- `research/astronomy-engine/interpretation/general/history/v0.1/comparison.json`
- `research/astronomy-engine/interpretation/general/history/v0.1/generate.mjs.txt`
- `research/astronomy-engine/interpretation/general/history/v0.1/lexicon.mjs.txt`
- `research/astronomy-engine/interpretation/general/history/v0.2/README.md`
- `research/astronomy-engine/interpretation/general/history/v0.2/case-1.json`
- `research/astronomy-engine/interpretation/general/history/v0.2/case-2.json`
- `research/astronomy-engine/interpretation/general/history/v0.2/case-3.json`
- `research/astronomy-engine/interpretation/general/history/v0.2/generate.mjs`
- `research/astronomy-engine/interpretation/general/history/v0.2/lexicon.mjs`
- `research/astronomy-engine/interpretation/general/history/v0.2/thematic.mjs`
- `research/astronomy-engine/interpretation/general/lexicon.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/CORRECTION_0_2_REVIEW.md`
- `research/astronomy-engine/interpretation/general/phase-d/README.md`
- `research/astronomy-engine/interpretation/general/phase-d/REVIEW.md`
- `research/astronomy-engine/interpretation/general/phase-d/attribution.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/audit.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/build-review.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/compose.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/examples/audit.json`
- `research/astronomy-engine/interpretation/general/phase-d/examples/case-1.json`
- `research/astronomy-engine/interpretation/general/phase-d/examples/case-1.md`
- `research/astronomy-engine/interpretation/general/phase-d/examples/case-2.json`
- `research/astronomy-engine/interpretation/general/phase-d/examples/case-2.md`
- `research/astronomy-engine/interpretation/general/phase-d/examples/case-3.json`
- `research/astronomy-engine/interpretation/general/phase-d/examples/case-3.md`
- `research/astronomy-engine/interpretation/general/phase-d/generate.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/interactions.mjs`
- `research/astronomy-engine/interpretation/general/phase-d/plan.mjs`
- `research/astronomy-engine/interpretation/general/thematic.mjs`
- `research/astronomy-engine/validation/general-interpretation.check.mjs`
- `research/astronomy-engine/validation/general-interpretation-browser.mjs`
- `research/astronomy-engine/validation/phase-d-synthesis.check.mjs`
- `research/astronomy-engine/validation/phase-d-attribution.check.mjs`
- `research/astronomy-engine/validation/phase-d-browser.mjs`
- `research/astronomy-engine/validation/relationship-review.check.mjs`
- `research/astronomy-engine/interpretation/RESEARCH_SAVE_MANIFEST.md`
