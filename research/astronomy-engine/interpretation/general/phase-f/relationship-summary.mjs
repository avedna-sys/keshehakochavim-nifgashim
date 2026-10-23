// Different relational questions for identical geometry. No names/fixture IDs select a rule.
import {aspectBinding} from '../phase-d/attribution.mjs';
const family=b=>[b.focal.body,b.counter.body].sort().join('|');
const end=(b,body)=>[b.focal,b.counter].find(e=>e.body===body);
const find=(bs,key,mode)=>bs.find(b=>family(b)===key&&(!mode||b.mode===mode));
export const relationalAxes={
 'זוגיות':{character:['partner-choice','desirability','mutual-initiative'],needs:['emotional-attunement','chosen-intimacy'],integration:['shared-life','commitment-negotiation']},
 'אחים':{character:['family-belonging','recognition-without-sameness'],needs:['family-boundaries','differentiation'],integration:['revisable-family-ties','nonfixed-obligations']},
 'הורה וילד':{character:['parental-duty','understandable-guidance'],needs:['developmental-voice','asymmetric-regulation'],integration:['autonomy','parental-scaffolding']},
 'חברות':{character:['shared-enjoyment','reciprocity'],needs:['requested-help','personal-space'],integration:['negotiated-availability','trust-without-entitlement']},
 'אחר':{character:['stated-context'],needs:['distinct-experiences'],integration:['explicit-expectations']},
};
const siblingNeed=[
 'האפשרות להביע תגובה ישירה בלי שתוגדר מיד כעימות משפחתי',
 'שמירה על קשר מוכר ומוחשי גם כאשר הבחירות אינן זהות',
 'מקום לברר באמצעות מילים וכמה נקודות מבט',
 'הרגשה שיש בקשר המשפחתי מקום מוגן לחוויה האישית',
 'הכרה אישית שאינה נבלעת בהגדרה של המשפחה כולה',
 'התייחסות מדויקת למה שנחוץ במקום הנחה שעזרה כללית מספיקה',
 'הדדיות שאפשר לדבר עליה בלי למחוק הבדל',
 'אמון שמאפשר לשתף בלי לוותר על הרשות לשמור דבר מה בנפרד',
 'מרחב לחיים ולמשמעות שאינם מוכרחים לעבור דרך המשפחה',
 'אמינות ביחסים בלי קיבוע של תפקיד אחראי אחד',
 'הזכות להחליט מה מן העולם האישי נכנס לשיחה המשפחתית',
 'רגישות לאווירה וקצב שמאפשר לתת לתחושה מילים',
];
const friendNeed=[
 'מפגש שיש בו תגובה חיה ויכולת להצטרף ביוזמה',
 'רצף פשוט ומוחשי של קשר שאפשר לסמוך עליו',
 'שיחה פתוחה שאפשר לשנות בה כיוון ולשאול',
 'קבלה חמה ואכפתיות שניכרות גם במחווה קטנה',
 'עניין אישי והרגשה שהנוכחות רצויה',
 'סיוע שנוגע לפרטים של הבקשה ולא רק לרצון הטוב',
 'התחשבות הדדית שאינה דורשת הסכמה בכל נושא',
 'אמון ופרטיות ביחס למה שנבחר לשתף',
 'הנאה מהתנסות ומרחב לעיסוקים עצמאיים',
 'ציפיות שאפשר לקיים בלי הבטחות רחבות מדי',
 'חופש לשמור טעם עצמאי ומרחב אישי',
 'רגישות לאווירה גם כשעדיין אין בקשה מפורשת',
];
export function relationshipSummary(model,participants,r){
 if(!['אחים','הורה וילד','חברות'].includes(model.relationship))return undefined;
 const n=model.names,order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id)),[a,b]=order;
 const bs=r.items.map(item=>({...aspectBinding(model,item),item})),pos=(i,body)=>model.facts.find(f=>f.id===`pos:${i?'B':'A'}:${body}`),moon=i=>pos(i,'Moon');
 const recognition=find(bs,'Sun|Venus','tension'),depth=find(bs,'Moon|Pluto','tension'),satSpeech=find(bs,'Mercury|Saturn','tension'),satAffection=find(bs,'Saturn|Venus','resource');
 if(model.relationship==='אחים'){
  if(r.part==='character'){
   if(recognition){const s=end(recognition,'Sun'),v=end(recognition,'Venus');return `הקשר בין ${n[a]} ל${n[b]} מעלה את שאלת ההכרה בתוך שייכות משפחתית. עבור ${n[s.person]}, עשוי להיות חשוב שהכיוון האישי לא ייבלע במה שנעים או מתאים ל${n[v.person]}. מחווה יכולה להביע אכפתיות ובכל זאת להחמיץ את הצורך שיראו עמדה נפרדת. הקשר המשפחתי יכול לשאת את ההבדל כאשר הכרה אינה מותנית בדמיון בטעם, בדרך הביטוי או בבחירה. זאת אפשרות לקרבה שבה כל אחד נשאר בן משפחה וגם אדם בפני עצמו.`;}
   return `בין ${n[a]} ל${n[b]}, שייכות משפחתית יכולה להיות מסגרת להכרה הדדית בלי לחייב זהות. הקשר בין אחים אינו מקבל את כל משמעותו מעצם הקרבה: אפשר לברר איזה סוג מפגש נותן מקום לכל אחד, ואילו ציפיות ראוי לנסח מחדש. אין כאן הנחה על היסטוריה משותפת מסוימת או על חלוקת תפקידים שהתקיימה בעבר.`;
  }
  if(r.part==='needs'){
   let text=`עבור ${n[a]}, הדגש עשוי להיות על ${siblingNeed[moon(a).signIndex]}; עבור ${n[b]}, על ${siblingNeed[moon(b).signIndex]}. `;
   if(depth){const m=end(depth,'Moon'),p=end(depth,'Pluto');text+=`המעורבות של ${n[p.person]} עשויה להיחוות אצל ${n[m.person]} גם כלחץ להסביר או לשתף. דווקא בתוך קשר משפחתי, עניין עמוק אינו מקנה זכות לדעת הכול. אפשר לשאול ולהציע הקשבה, ולהשאיר תשובה חלקית או זמן אחר לשיחה בלי לפרש אותם כהוצאה מן המעגל המשפחתי.`;}
   else text+='גבולות בין בני משפחה יכולים להבהיר איזה שיתוף רצוי ומתי נחוצה נפרדות. השאלה אינה מי קרוב יותר למשפחה, אלא כיצד נשמר מקום אישי בתוך הקשר.';
   return text;
  }
  let text='';
  if(satSpeech&&satAffection&&end(satSpeech,'Saturn').person===end(satAffection,'Saturn').person){const sa=end(satSpeech,'Saturn'),me=end(satSpeech,'Mercury');text=`העקביות של ${n[sa.person]} יכולה לתמוך בהרגשת אכפתיות, אך עבור ${n[me.person]} הדיבור עלול להיעשות זהיר אם כל ניסוח פוגש תיקון. כדי שהעזרה תחזק שייכות, חשוב שלא תיצור חוב של הסכמה או ויתור על עמדה. `;}
  else text='עזרה יכולה לטפח את השייכות כשהיא נשארת הצעה שאפשר להתאים, ולא הופכת להתחייבות משפחתית קבועה. ';
  return text+'קשר בין אחים יכול להשתנות לאורך החיים, עם הצרכים והבחירות שיתפתחו אצל כל אחד. אפשר לשמור על הכרה הדדית גם כאשר תדירות המפגש או סוג השיתוף משתנים. אין להסיק מכאן גיל, בכורה או תפקיד שמישהו כבר מילא; הכיוון המוצע הוא לאפשר בחירה מחודשת בצורה של הקשר, בלי להפוך שינוי להפרה של השייכות.';
 }
 if(model.relationship==='הורה וילד'){
  const parent=participants.findIndex(x=>x.role==='parent'),child=1-parent,p=n[parent],c=n[child],speech=find(bs,'Mercury|Saturn','tension'),encouragement=find(bs,'Jupiter|Sun','resource');
  if(r.part==='character')return speech?`בקשר של ${p} ו${c}, התקשורת היא חלק מן האחריות ההורית: ציפייה צריכה להיות מובנת, ושאלה צריכה להיות מותרת גם כשההסבר נראה ברור להורה. מפגש רציני בין מחשבה למסגרת יכול לעזור ליצור סדר, אך גם להפוך בירור לתחושה שצריך להשיב נכון מיד. האחריות של ${p} כהורה היא לבדוק איך ההנחיה נקלטה ולשמור את השיחה פתוחה. התגובה של ${c} יכולה ללמד על האופן שבו נחווית המסגרת; היא אינה מטילה על ${c} אחריות להחזיק אותה עבור ההורה.`:`במפגש בין ${p} ל${c}, תמיכה הורית מקבלת משמעות כאשר היא מאפשרת להבין מה מצופה וגם להביא תגובה עצמאית. זכותו של ההורה להציע מסגרת אינה דורשת מן הילד לחוות אותה בדיוק כפי שהתכוון ההורה. תפקידים אלה נמסרו במפורש ואינם נגזרים מסדר ההזנה.`;
  if(r.part==='needs'){
   const cm=moon(child),pm=moon(parent);
   const childVoice=cm.signIndex===2?'בירור במילים, אפשרות לשאול ולעבור בין כמה הסברים':cm.signIndex===10?'אפשרות לגבש עמדה עצמאית בלי שתיקבע עבורו משמעות החוויה':'אפשרות להביא את החוויה בדרך ובקצב המתאימים לה';
   const parentStyle=pm.signIndex===10?'לתת ערך לעצמאות מחשבתית ולמרחב אישי':pm.signIndex===2?'לנסות להבין דרך שיחה ובחינת חלופות':'לבטא תמיכה מתוך דרך המענה האישית שלו';
   return `עבור ${c}, דרך חשובה לעבד את המפגש עשויה להיות ${childVoice}. אצל ${p}, עשויה להיות נטייה ${parentStyle}, אך כוונה לעודד עצמאות אינה זהה ליכולת לזהות מה כבר הובן ומה עדיין דורש ליווי. אוטונומיה אינה בקשה להסתדר לבד. על ההורה להבחין בין מתן מרחב לבין נסיגה מן ההקשבה, ולבדוק אם יש צורך בהסבר נוסף, בזמן או בעזרה מוגדרת. אין להסיק מן ההבדל הזה גיל או שלב התפתחות מסוים.`;
  }
  let text='';
  if(encouragement&&end(encouragement,'Jupiter').person===parent&&end(encouragement,'Sun').person===child)text=`בתמיכה של ${p} יש אפשרות לחזק אצל ${c} את ההרגשה שיש מקום להתנסות ולפתח כיוון אישי. העידוד נעשה משמעותי כשהוא מכיר בתהליך, גם לפני שהתוצאה תואמת את הציפייה. `;
  else text='האפשרות להתפתחות נבחנת באופן שבו תמיכה ומסגרת מותאמות לתגובה שמתקבלת, בלי להעמיס על הילד את רגשות ההורה. ';
  return text+`מכאן שהאחריות של ${p} כהורה היא להציע תנאים מובנים, להקשיב ולתקן את דרך ההכוונה, כך שאוטונומיה תוכל להתפתח לצד ליווי. התפקיד של ${c} אינו ליישב את המתח עבור ההורה או לספק אישור להצלחתו, אלא לקבל אפשרות לשאול, להתנגד וללמוד בתוך קשר שאינו מתנה תמיכה בהסכמה מלאה.`;
 }
 // Friendship: negotiated reciprocity, not family entitlement or couple commitment.
 const satAction=find(bs,'Mars|Saturn','tension'),satPreference=find(bs,'Saturn|Venus','tension');
 if(r.part==='character'){
  if(satAction){const ma=end(satAction,'Mars'),sa=end(satAction,'Saturn');return `החברות בין ${n[a]} ל${n[b]} יכולה לקבל עניין מן הרצון לעשות וליהנות יחד, אך ההדדיות נבחנת גם כשההזמנה אינה מתקבלת באותו קצב. היוזמה של ${n[ma.person]} עשויה לפגוש אצל ${n[sa.person]} צורך להגדיר היקף, זמן או תנאי השתתפות. זה אינו מחייב בחירה בין התלהבות לבין אמינות: אפשר לתת להצעה צורה שאפשר להצטרף אליה, לסרב לה או לשנות אותה בלי להפוך את התשובה למבחן של החברות.`;}
  return `בחברות של ${n[a]} ו${n[b]}, הנאה משותפת ואמון יכולים להתפתח מתוך מפגש ששני האנשים רוצים להשתתף בו. הדדיות אינה דורשת תרומה זהה בכל רגע, אך היא זקוקה לאפשרות לברר מה נעים, איזו עזרה רצויה ואיזה מרחב כל אחד מבקש לעצמו.`;
 }
 if(r.part==='needs')return `עבור ${n[a]}, עשוי להיות חשוב לחוות ${friendNeed[moon(a).signIndex]}; עבור ${n[b]}, ${friendNeed[moon(b).signIndex]}. אלה דרכים שונות לזהות עזרה מיטיבה, ולא תפקידים של נותן ומקבל שנקבעו מראש. בחברות, כדאי להבחין בין הבחנה בקושי לבין הזמנה להתערב: לשאול איזו עזרה רצויה ולהשאיר מקום לתשובה. מרחב אישי מאפשר לכל אחד להביא למפגש רצון מחודש, בלי לדרוש מן האחר להסביר כל הפוגה בזמינות.`;
 let text='';
 if(satPreference){const v=end(satPreference,'Venus'),sa=end(satPreference,'Saturn');text=`עבור ${n[v.person]}, מענה מאופק מצד ${n[sa.person]} עלול להישמע כחוסר הערכה גם כשמדובר במגבלה מעשית. אמון ייבנה ביתר קלות אם אפשר להבדיל בין היחס לחבר לבין היכולת להיענות להצעה מסוימת. `;}
 else text='אפשר לשמור על אמון כאשר ההצעה לעזור והיכולת לקבל עזרה נשארות נושאים שאפשר לדבר עליהם. ';
 return text+'הדרך להמשך אינה מחייבת קשר אינטנסיבי יותר, אלא הדדיות שניתנת להתאמה: מה אפשר לתת כעת, מה רוצים לעשות יחד ומתי נחוץ זמן נפרד. כך הנאה משותפת אינה נעשית חובת השתתפות, ועזרה אינה מקנה זכות לזמינות שאינה מוגבלת.';
}
