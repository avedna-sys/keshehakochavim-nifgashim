import {dynamicMeaning} from './meanings.mjs';
import {commitment,growth,growthEnd,summary} from './editorial.mjs';
const expressions={Sun:['הכרה ברצון האישי','יכולת להביא כיוון ולהתמיד בו'],Moon:['מענה לצורך הרגשי','תחושת רצף גם בזמן רגישות'],Mercury:['מרחב לשאול ולנסח','הפיכת הבנות להסכמים שניתן לבדוק'],Venus:['מחווה והבעת הערכה','שמירה על מקום לטעם ולנעימות'],Mars:['אפשרות ליזום ולהגיב','הפיכת החלטה לצעד מעשי']};
export function commitmentMeaning(binding){
 const {focal:a,counter:b,mode}=binding,[need,expression]=expressions[b.body]??['מפגש בין תפקודים','תיאום בתחום החיים שנמצא'];
 if(a.body==='Saturn')return mode==='resource'?`המסגרת יכולה לתמוך ב${need}, ולהעניק לרצף משמעות של אמינות. האפשרות המעשית היא ${expression}, בלי להפוך התמדה לבחינה מתמדת של האדם.`:mode==='tension'?`עשוי להתפתח פער בין דרישה לעקביות לבין ${need}. עיכוב, תיקון או ציפייה לתוצאה עלולים להיחוות כביקורת; הצמיחה האפשרית היא להגדיר אחריות שאפשר לשאת, במקום למדוד ערך אישי דרך עמידה בדרישה.`:`אחריות ו${need} נקשרות לאותו מפגש. הרצינות יכולה לעזור להתמיד, אך גם להכביד כאשר כל תגובה מקבלת משקל של התחייבות; כדאי להפריד בין רצון להשתתף לבין היקף המשימה.`;
 if(a.body==='Jupiter')return mode==='resource'?`עידוד והרחבת מבט יכולים לתמוך ב${need}. האמון באפשרות להתקדם עשוי לתת אומץ להתנסות, ואילו ${expression} נותנת לעידוד צורה שאפשר לחזור אליה.`:mode==='tension'?`התלהבות או תמונה רחבה עלולות להקדים את ${need}. הבטחה מיטיבה בכוונתה עשויה להיות גדולה ממה שניתן לקיים; התמיכה נעשית אמינה יותר כאשר בודקים היקף וקצב לפני שמרחיבים ציפיות.`:`העידוד ו${need} נפגשים בעוצמה ויכולים להרחיב תקווה. אותה התרחבות עשויה גם להגדיל ציפיות; יש ערך להבחנה בין האפשרות שרואים לבין מה שמתחייבים לבצע כעת.`;
 const personalMeaning=dynamicMeaning(binding);if(personalMeaning)return personalMeaning+'. הקישור למחויבות נובע כאן מתפקיד השליט, ואינו הופך את ההיבט למדד למשך הקשר.';
 return mode==='resource'?'מגע דרך שליט רלוונטי מציע דרך לתאם ציפיות בתחום החיים שהוא נושא; אין בכך לבדו מדד ליציבות לאורך זמן.':mode==='tension'?'מגע דרך שליט רלוונטי מחדד פער בציפיות בתחום שהוא נושא. אפשר להיעזר בפער לבירור תפקידים, בלי להפוך אותו לקביעה על יכולת לקיים קשר.':'המגע דרך השליט מרכז כמה ציפיות באותה נקודה; נדרשת הבחנה בין התפקידים כדי שלא ייחשבו לבקשה אחת.';
}
export function render(model,participants,r){
 if(r.kind==='commitment-block')return commitment(model,participants,r);
 if(r.kind==='growth-interaction')return growth(model,participants,r);
 if(r.kind==='growth-end')return growthEnd(model,participants);
 if(r.kind==='summary-prose')return summary(model,participants,r);
 throw Error('Unsupported phase F editorial recipe');
}
