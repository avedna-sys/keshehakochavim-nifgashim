import {romanticAspect,romanticSynthesis} from './romantic.mjs';
import {bodyFunctions} from '../lexicon.mjs';
import {pointInfo} from '../../../synastry.mjs';
import {houseContexts} from '../../content.mjs';
import {style,mechanisms} from './language.mjs';
import {aspectBinding,bindingAnchor} from '../phase-d/attribution.mjs';
const pid=i=>i?'B':'A';
export const frameFor=(model,item)=>aspectBinding(model,item);
export function refsFor(b){return[b.factId,b.focal.positionId,b.counter.positionId,b.focal.overlayId,b.counter.overlayId];}
export function renderRecipe(model,participants,recipe){
 const index=new Map(model.facts.map(f=>[f.id,f])),name=i=>model.names[i],body=b=>pointInfo[b][0],couple=model.relationship==='זוגיות';
 const pos=(i,b)=>index.get(`pos:${pid(i)}:${b}`),overlay=(i,b)=>index.get(`overlay:${pid(i)}:${b}:in:${pid(1-i)}`);
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));
 if(couple&&recipe.kind==='aspect')return romanticAspect(model,recipe);
 if(couple&&recipe.kind==='synthesis')return romanticSynthesis(model,recipe);
 if(recipe.kind==='aspect'){
  const b=frameFor(model,recipe.item),e=mechanisms[recipe.item.theme],meaning=e[couple?'couple':'social'],i=b.focal.person,j=b.counter.person;
  let text=bindingAnchor(model,b,recipe.detailed)+' — '+(b.mode==='tension'?`המתח עשוי להתבטא בכך ש${meaning[1]}.`:b.mode==='resource'?`נפתחת אפשרות שבה ${meaning[0]}.`:`שני התפקודים מתקרבים; ${meaning[0]}, אך ${meaning[1]}.`);
  if(recipe.item.theme==='house-ruler'){
   const domains=recipe.item.rulerIds.map(id=>index.get(id)).map(r=>`בית ${r.house} של ${name(r.person)}`).join(' ו');
   const mechanism=b.mode==='tension'?'תיאום התפקודים דורש בירור של ציפיות ותפקידים':b.mode==='resource'?'נפתחת אפשרות לתיאום שאינו מחליף בחירה נפרדת':'התפקודים מתקרבים בלי להפוך את הציפיות לזהות';
   text=bindingAnchor(model,b,recipe.detailed)+` — ${bodyFunctions[b.focal.body]} פוגש ${bodyFunctions[b.counter.body]}, בהקשר של ${domains}. ${mechanism}; זהו ערוץ דרך שליטה; אין להחליף בו את משמעותם של הגופים המשתתפים.`;
  }
  if(recipe.detailed){
   text+=` אצל ${name(i)}, הנטייה הסמלית היא ${style(b.focal)}; אצל ${name(j)}, ${style(b.counter)}. `;
   text+=b.focal.natalHouse===b.counter.natalHouse?` שני התפקודים נמצאים בבית ${b.focal.natalHouse} במפות הלידה, ולכן תחום ${houseContexts[b.focal.natalHouse]} משותף לשאלה, אך אינו הופך את דרכי המענה לזהות.`:` ${body(b.focal.body)} בבית ${b.focal.natalHouse} של ${name(i)} מציב את התפקוד בתחום ${houseContexts[b.focal.natalHouse]}, בעוד ${body(b.counter.body)} בבית ${b.counter.natalHouse} של ${name(j)} קושר את התפקוד האחר ל${houseContexts[b.counter.natalHouse]}.`;
  }
  const d=(b.counter.signIndex-b.focal.signIndex+12)%12;
  if(Math.min(d,12-d)*30!==index.get(b.factId).angle)text+=' ההיבט חוצה את המבנה המזלי הטיפוסי שלו; אין להחליף את המזלות במבנה הרגיל של הזווית.';
  return text;
 }
 if(recipe.kind==='context'){
  const focus={love:'Venus',attraction:'Mars',intimacy:'Moon'}[recipe.topic];
  const endpoints=order.map(i=>({person:i,p:pos(i,focus),o:overlay(i,focus)}));
  const [a,b]=endpoints;
  const contextKind={love:'ההעדפה',attraction:'היוזמה',intimacy:'התגובה הרגשית'}[recipe.topic];
  const meanings=endpoints.map(({person:i,p:x})=>`במפת ${name(i)}, המיקום של ${body(focus)} ב${x.sign}, בבית ${x.ownHouse.house}, מוסיף את הגוון הסמלי: ${style(x)}`);
  if(a.p.signIndex===b.p.signIndex){
   const own=`${body(focus)} נמצא ב${a.p.sign} אצל שניהם, ולכן אותה שפה סמלית — ${style(a.p)} — מופיעה בשתי המפות. אצל ${name(a.person)} המיקום בבית ${a.p.ownHouse.house}, ואצל ${name(b.person)} בבית ${b.p.ownHouse.house}; דמיון במזל אינו זהות של הקשר חיים.`;
   return own+' '+(a.o.house===b.o.house?`בשני הכיוונים החפיפה היא לבית ${a.o.house}, בתחום ${houseContexts[a.o.house]}, בלי להניח שהחוויה מתחלקת באופן זהה.`:`החפיפה של ${name(a.person)} פונה לבית ${a.o.house} של ${name(b.person)}, ואילו זו של ${name(b.person)} לבית ${b.o.house} של ${name(a.person)}; אלה זירות מפגש שונות.`);
  }
  if(a.o.house===b.o.house)return meanings.join('. ')+`. בשני הכיוונים ${contextKind} נכנסת לבית ${a.o.house} של האחר, בתחום ${houseContexts[a.o.house]}. אותו תחום מפגש מקבל כאן שני סגנונות שונים, ולכן אינו מבטיח מענה זהה.`;
  return meanings.map((s,j)=>s+`. החפיפה לבית ${endpoints[j].o.house} של ${name(1-endpoints[j].person)} מכניסה את ${contextKind} לתחום של ${houseContexts[endpoints[j].o.house]}.`).join(' ');

 }
 if(recipe.kind==='rulers'){
  const terms=couple?{5:'ההנאה והביטוי האישי',7:'הבחירה בשותפות',8:'האמון וגבולות השיתוף'}:{5:'היצירה והפעילות המשותפת',7:'המפגש וההסכמות',8:'הפרטיות וגבולות השיתוף'};
  const groups=new Map();for(const id of recipe.rulerIds){const r=index.get(id),key=participants[r.person].id+':'+r.ruler;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  if(recipe.reusedIds.length===recipe.rulerIds.length&&groups.size===2){const rs=[...groups.values()].map(x=>x[0]);if(rs[0].ruler===rs[1].ruler)return `${body(rs[0].ruler)} של ${name(rs[0].person)} ושל ${name(rs[1].person)}, שמיקומיהם כבר נדונו בנפרד, נושאים כאן גם את התחום של ${terms[rs[0].house]}. השיתוף בשם השליט אינו הופך את מיקומיו או את חוויות האנשים לזהים.`;}
  return [...groups.values()].map(rs=>{const r=rs[0],x=pos(r.person,r.ruler),o=overlay(r.person,r.ruler);if(recipe.reusedIds.includes(r.id))return `${body(r.ruler)} של ${name(r.person)}, שמיקומו כבר נדון, נושא כאן גם את התחום של ${rs.map(r=>terms[r.house]).join(' ו')}; זו חוליית הקשר נוספת, ולא היבט חדש.`;return `אצל ${name(r.person)}, התחום של ${rs.map(r=>terms[r.house]).join(' ו')} מקבל הקשר דרך ${body(r.ruler)} ב${x.sign}, בשליטה מסורתית. ${body(r.ruler)} ב${x.sign} נמצא בבית ${r.natalHouse} במפת הלידה ובבית ${r.partnerHouse} של ${name(1-r.person)}, ומחבר ${houseContexts[r.natalHouse]} ל${houseContexts[r.partnerHouse]}.${rs.length>1?' כמה תחומים עוברים כאן דרך אותו שליט; אין לספור אותם כאישורים עצמאיים.':''}${r.quality==='cusp-sign-sensitive'||o.nearCusp?' השיוך סמוך לגבול ולכן אינו עוגן יחיד למסקנה.':''}`;}).join(' ');
 }
 if(recipe.kind==='synthesis')return synthesize(model,participants,recipe);
 if(recipe.kind==='coverage')return recipe.noActive?'אין כאן ממצא כשיר להובלת ניתוח היבטים בפרק. הקשרי המיקום והבתים מאפשרים שאלות לבירור, אך אינם מצדיקים המצאת דפוס חזק.':'הממצאים הרחבים נשמרו במקורות. הם אינם מקבלים משקל של מגע הדוק, והיעדר מגע בטווחי המנוע אינו קביעה על איכות הקשר בפועל.';
 throw Error('Unknown rendering recipe');
}
function synthesize(model,participants,r){
 const name=i=>model.names[i],couple=model.relationship==='זוגיות',index=new Map(model.facts.map(f=>[f.id,f]));
 const frames=r.items.map(item=>({...frameFor(model,item),theme:item.theme,central:item.central,role:item.role,rulerIds:item.rulerIds}));
 const find=theme=>frames.find(x=>x.theme===theme),recognition=find('recognition'),receptivity=find('receptivity'),values=find('values'),wanting=find('wanting-and-acting'),tempo=find('tempo'),initiative=find('initiative'),depth=find('emotional-depth'),agency=find('agency-and-influence'),valueDepth=find('value-and-disclosure'),response=find('response-and-vulnerability');
 const recognitions=frames.filter(x=>x.theme==='recognition'),wantings=frames.filter(x=>x.theme==='wanting-and-acting'),identityNeeds=find('identity-and-needs'),rulerChannel=find('house-ruler');
 const f=frames.find(b=>b.central)??frames[0];
 if(!f)return 'אין בסיס לשלב היבטים שלא נמצאו. הקריאה נשארת מוגבלת למיקומים, לחפיפות ולשליטה המסורתית שנבדקו; אין להסיק מכך שחסר בקשר צורך אנושי מסוים.';
 let text;
 if(!couple){
  if(r.topic==='love')text=`החיבה נקראת כאן דרך ${recognition?'ההבדל בין הערכה לרצון אישי':receptivity?'ההבדל בין מחווה למענה רגשי':values?'ההבדל בין שייכות לטעם משותף':'הזכות לביטוי נפרד בתוך קשר קרוב'}. ${name(f.focal.person)} פוגש את ${name(f.counter.person)} מתוך הקשר של בית ${f.focal.partnerHouse} אצל האחר; תמיכה אינה מחייבת שההעדפה תתקבל כהנחיה. אפשר להכיר באדם בלי לבחור עבורו, ואפשר להשתתף בלי לאמץ כל דרך ביטוי שלו.`;
  if(r.topic==='attraction')text=`השאלה היא כיצד מחברים רצון להשתתף לדרך הפעולה, בלי להחליט עבור האחר. ${wanting?`העדפה של ${name(wanting.focal.person)} פוגשת יוזמה של ${name(wanting.counter.person)}; עצם הנכונות לפעול אינה אומרת שהפעילות נבחרה בשני הצדדים.`:tempo?`שני כוכבי מאדים מדגישים קצבי פעולה; תיאום משימה אינו מחייב קצב זהה.`:`היוזמה שנמצאה מאפשרת לברר מי מציע כיוון ומי רוצה להצטרף אליו, בלי להסיק תפקיד קבוע.`} המשמעות נבחנת בהסכמה על הפעילות, בזכות לשנות דעה ובאפשרות לעצור.`;
  if(r.topic==='intimacy')text=`האמון אינו נמדד בכמות המידע שנמסר. ${depth?`הירח של ${name(depth.focal.person)} פוגש פלוטו של ${name(depth.counter.person)}, ולכן חשוב להבחין בין נכונות להקשיב לבין דרישה להיחשף.`:agency?`המגע עם פלוטו ומאדים מדגיש את ההבדל בין יכולת להשפיע לבין רשות להכריע.`:valueDepth?'הערכה עמוקה אינה מקנה בעלות על בחירתו של האחר.':'המענה המעשי והקשרי השיתוף מאפשרים לבחון איזו עזרה אכן רצויה.'} פרטיות יכולה להתקיים לצד אכפתיות; אין לפרש גבול כראיה להיעדר אמון.`;
  if(model.relationship==='הורה וילד'){const parent=participants.findIndex(p=>p.role==='parent'),child=1-parent;text+=r.topic==='love'?` ${name(parent)} הוא ההורה לפי התפקיד שנמסר; חיבה אינה בקשה מ${name(child)} לאשר כל בחירה של ההורה.`:r.topic==='attraction'?` האחריות של ${name(parent)} להציע מסגרת אינה הופכת את ${name(child)} לאחראי לניהול ההתלהבות או האכזבה של ההורה. אין להסיק מן המפה קטינות או תלות.`:` הזכות של ${name(child)} לפרטיות נשמרת גם מול ${name(parent)} כהורה; האחריות לכבד גבול אינה סימטרית.`;}
  else if(model.relationship==='חברות')text+=r.topic==='love'?' חברות יכולה לשמור על חיבה גם כאשר יש טעם או בחירה שונים.':r.topic==='attraction'?' הצעה לפעילות בין חברים יכולה להישאר הזמנה, ללא חובה להצטרף.':' בחברות, רצון טוב אינו התחייבות לזמינות בלתי מוגבלת; כדאי להשאיר מקום לבקשה ולתשובה נפרדות.';
  else if(model.relationship==='אחים')text+=' סדר ההזנה אינו בכורה, וההיסטוריה המשפחתית אינה סמכות להגדיר את חוויית האחר.';
  return text;
 }
 if(r.topic==='love'){
  if(recognition&&receptivity)text=`ההכרה בערך האישי והמענה הרגשי אינם אותו מעשה. המגע לשמש פונה ל${name(recognition.focal.person)}, והמגע לירח פונה ל${name(receptivity.focal.person)}. ${recognition.focal.person===receptivity.focal.person?'אותו אדם עשוי להרגיש שמעריכים את רצונו ובכל זאת להזדקק למחווה אחרת כשהוא פגיע.':'הכיוונים שונים: אפשר להעניק הערכה לאחד בלי שכבר נענה הצורך בביטחון של האחר.'} לכן שפה אוהבת צריכה להכיל גם בחירה במה שמעריכים וגם בירור של מה שמרגיע; אחד אינו משמש הוכחה שהשני כבר נענה.`;
  else if(recognitions.length>1){const a=recognitions[0],b=recognitions[1];text=`הערכה עוברת כאן בשני הכיוונים, אבל אינה פועלת באותו אופן. השמש של ${name(a.focal.person)} פוגשת ונוס של ${name(a.counter.person)} בערוץ ${a.mode==='tension'?'מאתגר':a.mode==='resource'?'תומך':'המאחד תפקודים'}, ואילו הכיוון השני הוא ${b.mode==='tension'?'מאתגר':b.mode==='resource'?'תומך':'מפגש קרוב של תפקודים'}. לכן היכולת של אחד להעניק מחווה אינה מוכיחה שהוא מקבל הכרה בדרך המתאימה לו. ההדדיות נבחנת בזכות של כל אחד לומר מה הוא רוצה, בלי להפוך את המחווה שכבר ניתנה לחוב שהאחר צריך להחזיר.`;}
  else if(values)text=`מוכרות והסכמה בטעם אינן תנאי מספיק להדדיות. המגע בין כוכבי ונוס מאפשר לשאול אם כל אחד יכול להביא העדפה שונה בלי שהבדל יישמע כדחייה. ההקשר של בית ${values.focal.partnerHouse} אצל ${name(values.counter.person)} מצביע על זירת המפגש, אך אינו הופך את טעמו של ${name(values.focal.person)} לצורך משותף. הקריאה מציעה לבנות מקום לבחירה נפרדת בתוך החיבה, ולא למדוד את הקשר רק לפי מידת הדמיון.`;
  else if(recognition)text=`כאשר ההכרה בשמש היא הערוץ הבולט, יש ערך לשאלה איך הרצון של ${name(recognition.focal.person)} מקבל מקום מול ההעדפות של ${name(recognition.counter.person)}. מחווה אוהבת יכולה לעודד ביטוי עצמי, אך הסכמה לרצון מסוים צריכה להישאר בחירה נפרדת. ${r.missing.includes('Moon|Venus')?'לא נמצא כאן מגע ירח–ונוס בטווחי המנוע; אין להשליך מן הערוץ של הערכה על אופן ההרגעה הרגשית, ואין להסיק מכך היעדר חיבה.':'החוויה הרגשית נבחנת במגעיה שלה ולא נגזרת מעצם ההערכה.'}`;
  else text=`הציר שנמצא מדגיש ${receptivity?'התאמה של מחווה לצורך רגשי':'את היחס בין כיוון אישי לתחושת שייכות'}. אצל ${name(f.focal.person)} המפגש נכנס לבית ${f.focal.partnerHouse} של ${name(f.counter.person)}, כך שהמשמעות אינה בהכרח זהה לזו שבמפת הלידה. הקריאה מציעה להבחין בין הרגל מוכר, רצון והיענות: אפשר לטפח קרבה בלי להניח שהתגובה שנעימה לאחד תתאים לשני.`;
 }
 if(r.topic==='attraction'){
  if(wanting&&tempo)text=`יש כאן הבדל בין מה שמושך את ההעדפה לבין האופן שבו פועלים. ונוס של ${name(wanting.focal.person)} פוגשת מאדים של ${name(wanting.counter.person)}, ובנפרד שני כוכבי מאדים מציגים את שאלת הקצב. תיאום פעולה אינו מוכיח ששניהם רוצים אותו דבר, והבדל בדרך היוזמה אינו מעיד בהכרח על היעדר עניין. הסינתזה מציעה לברר קודם מה רצוי, אחר כך באיזה קצב להתקדם, ולהשאיר להסכמה אפשרות להשתנות.`;
  else if(wantings.length>1){const a=wantings[0],b=wantings[1];text=`ההעדפה והיוזמה נפגשות בשני הכיוונים, אך אין כאן דינמיקה אחידה. כאשר ונוס של ${name(a.focal.person)} פוגשת את מאדים של ${name(a.counter.person)}, הערוץ ${a.mode==='tension'?'מדגיש פער בקצב או בדרך ההיענות':'מאפשר מענה אך אינו מחליף בחירה'}; בכיוון ההפוך ${b.mode==='resource'?'קיימת אפשרות תומכת יותר לתיאום':b.mode==='tension'?'נדרש בירור נוסף של הרצון':'הקירבה בין התפקודים דורשת להשאיר מקום להעדפה נפרדת'}. מי שיכול ליזום בדרך נעימה עבור האחר עשוי להזדקק למענה אחר כשהוא עצמו מבטא העדפה. לכן אין להשתמש בקלות בכיוון אחד כהוכחה ששניהם רוצים אותו דבר, או כתחליף להסכמה על קצב.`;}
  else if(wanting)text=`הערוץ בין ונוס של ${name(wanting.focal.person)} למאדים של ${name(wanting.counter.person)} מחבר העדפה ליוזמה, אך אינו מודד משיכה בפועל. העדפה שלא קיבלה קול יכולה להיראות כהיענות כאשר הצד האחר כבר התחיל לפעול. כאן עומק הקריאה הוא בהבחנה בין עניין, רצון ועיתוי: יוזמה יכולה להזמין, והתגובה נשארת בחירה. ${r.missing.includes('Mars|Mars')?'אין מגע מאדים–מאדים בטווחי המנוע, ולכן אין בסיס לתאר תיאום ישיר בין שני קצבי הפעולה.':''}`;
  else if(tempo)text=`הממצא מציג מפגש בין קצבי פעולה, ולא תחליף למגע בין העדפה ליוזמה. ${r.missing.includes('Mars|Venus')?'מגע ונוס–מאדים אינו נמצא בטווחי המנוע, ולכן לא נגזרת ממנו כאן מסקנה על תשוקה או התאמה גופנית.':''} אפשר לקרוא את הקשר בין כוכבי מאדים כדרך לברר מי מתחיל, מי מגיב ומתי עוצרים; גם קצב דומה זקוק להסכמה, וגם קצב שונה יכול לקבל תיאום.`;
  else if(initiative)text=`החיבור שנמצא עוסק בהנעת רצון: השמש של ${name(initiative.focal.person)} פוגשת מאדים של ${name(initiative.counter.person)}. עשייה יכולה לעזור לרצון לקבל צורה, אך גם להשאיר אדם בתפקיד מי שמגיב לכיוון שכבר נקבע. ${r.missing.includes('Mars|Venus')?'מאחר שלא נמצא מגע ונוס–מאדים בטווחים שנבחרו, אין להרחיב את התיאור הזה לקביעה על משיכה גופנית.':''} השאלה המועילה היא אם שניהם יכולים גם להציע וגם לבחור אם להצטרף.`;
  else text='אין ערוץ אישי כשיר שמאפשר לתאר כאן את הדינמיקה של העדפה ויוזמה במישרין. קשרי השליטים מספקים תחום לבירור, אך אינם מדד לתשוקה או להסכמה.';
 }
 if(r.topic==='intimacy'){
  if(depth&&agency&&valueDepth)text=`העוצמה נוגעת כאן בשלושה רבדים שאסור לאחד: תחושת הערך והבחירה של ${name(valueDepth.focal.person)}, הביטחון הרגשי של ${name(depth.focal.person)} והיכולת לפעול של ${name(agency.focal.person)}. המגע ההדוק של ונוס עם פלוטו אינו מעניק גישה אוטומטית לרגש שהירח מייצג, והנכונות ליוזמה אינה מוכיחה רצון לחשיפה נוספת. ההבנה המשולבת היא שאפשר להרגיש קשר משמעותי מאוד ובכל זאת להזדקק לגבולות שונים בהעדפה, בשיתוף ובמעשה. דווקא הכרה בהבדלים יכולה להשאיר את הקרבה נבחרת, במקום להפוך את עוצמתה למבחן של נאמנות.`;
  else if(depth&&agency)text=`הנכונות להרגיש לעומק והיכולת להניע פעולה הן שאלות שונות. הירח של ${name(depth.focal.person)} נוגע בהשפעה של ${name(depth.counter.person)}, ואילו מאדים של ${name(agency.focal.person)} מציג את שאלת הרשות לפעול מול ${name(agency.counter.person)}. עוצמה אינה מחברת אותן אוטומטית: אפשר לחוות קרבה ועדיין להזדקק להאטה או לגבול. הסינתזה מציעה לתת מקום לתחושה לפני החלטה, ולא להפוך חשיפה להסכמה לפעולה.`;
  else if(depth||valueDepth){const x=depth??valueDepth;text=`המשמעות של העומק אינה נמדדת בכמות החשיפה. ${depth?'הירח':'ונוס'} של ${name(x.focal.person)} פוגש פלוטו של ${name(x.counter.person)}, ולכן יש להבחין בין עניין משמעותי באחר לבין ציפייה לקבל גישה מלאה לחווייתו. גבול אינו סותר בהכרח קרבה; הוא עשוי להיות התנאי לכך שהקשר יישאר נבחר. ${r.missing.includes('Moon|Pluto')?'לא נמצא כאן מגע ירח–פלוטו בטווחי המנוע, ולכן אין לייחס לערוץ ההעדפה דפוס רגשי עמוק שלא חושב.':''}`;}
  else if(agency)text=`המגע של מאדים עם פלוטו מדגיש את היחס בין יכולת להשפיע לבין בחירה הדדית. אין ממנו לבדו מסקנה על ביטחון רגשי, וגם כשאין ערוץ רגשי מוביל אין להסיק היעדר עומק אנושי. השאלה היא אם הכוח להניע משאיר מקום גם לעצירה ולתיקון כיוון, ולא אם עוצמת הפעולה מוכיחה את איכות הקרבה.`;
  else text=`${response?`הירח של ${name(response.focal.person)} פוגש את היוזמה של ${name(response.counter.person)}, כך שמענה מעשי יכול להגיע לפני שהצורך התבהר.`:'ההקשרים שנמצאו נוגעים לשיתוף ולבחירה, בלי ערוץ אישי מוביל של עומק.'} אין להוסיף מכאן סיפור פלוטוני שאינו נתמך. קרבה יכולה להיבנות דרך בירור של מה שנעים ומה שמרגיש בטוח, בקצב שאינו נקבע מתוך מחווה אחת.`;
  text+=' הסכמה ופרטיות הן תנאים אנושיים לבחירה, ולא נתונים שאפשר להוכיח מן המפה.';
 }
 if(r.topic==='love'&&recognition&&receptivity&&identityNeeds?.mode==='resource')text+=` המגע התומך בין הירח של ${name(identityNeeds.focal.person)} לשמש של ${name(identityNeeds.counter.person)} מציע מקום שבו אפשר לתת לרצון ולרגש להישמע יחד; הוא אינו מחליף את בירור ההעדפות דרך ונוס.`;
 if(r.topic==='attraction'&&initiative&&rulerChannel&&rulerChannel.counter.body===initiative.counter.body&&rulerChannel.counter.person===initiative.counter.person){const rr=index.get(rulerChannel.rulerIds[0]);text+=` גם שליט בית ${rr.house} של ${name(rr.person)} פוגש את אותו ${pointInfo[initiative.counter.body][0]} של ${name(initiative.counter.person)}. לכן הצורך להסדיר את התחום שהשליט נושא יכול להצטרף לרצון לפעול, אך מסגרת שנקבעה אינה הסכמה לכל יוזמה.`;}
 if(!frames.some(b=>b.central))text+=' אין בפרק עוגן מרכזי לפי מדיניות המשקל; ההצעה נשארת מוגבלת ולא מתארת דפוס חזק.';
 return text;
}
