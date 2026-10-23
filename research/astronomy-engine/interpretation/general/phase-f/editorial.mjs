import {relationshipSummary} from './relationship-summary.mjs';
// Phase F revision: evidence-bound composition, not fixture/name-conditioned prose.
import {aspectBinding} from '../phase-d/attribution.mjs';
import {associatedRulers,closure,channel} from './plan.mjs';
const endpoint=(b,body)=>[b.focal,b.counter].find(e=>e.body===body);
const family=b=>[b.focal.body,b.counter.body].sort().join('|');
const sameNode=(a,b)=>[a.focal,a.counter].some(x=>[b.focal,b.counter].some(y=>x.person===y.person&&x.body===y.body));
export function frames(model,items){return items.map(item=>({...aspectBinding(model,item),item}));}
export function contextualRefs(model){
 return closure(model,model.facts.filter(f=>f.kind==='position'&&['Moon','Mercury','Venus','Mars','Sun'].includes(f.body)||f.kind==='ruler'&&[3,4,5,7,8,11].includes(f.house)&&f.quality!=='cusp-sign-sensitive').map(f=>f.id));
}
export function people(model,participants){return [0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));}
export function selectInteraction(model,items){
 const bs=frames(model,items),tensions=bs.filter(b=>b.mode==='tension'),resources=bs.filter(b=>b.mode==='resource'),patterns=[],used=new Set();
 for(const t of tensions){
  if(used.has(t.factId))continue;
  const resource=resources.map(r=>({r,score:(family(t)===family(r)?5:0)+(sameNode(t,r)?4:0)+(channel(t.item)===channel(r.item)?2:0)+(r.item.central?1:0)})).sort((a,b)=>b.score-a.score||a.r.item.key.localeCompare(b.r.item.key))[0]?.r;
  const concept=channel(t.item);
  if(patterns.some(p=>p.concept===concept))continue;
  patterns.push({concept,items:[t.item,...(resource?[resource.item]:[])],sharedNode:resource?sameNode(t,resource):false});used.add(t.factId);
 }
 if(!patterns.length)for(const r of resources)if(!used.has(r.factId)){patterns.push({concept:family(r)+':'+r.focal.person,items:[r.item],sharedNode:false});used.add(r.factId);}
 return patterns;
}
const needWords=['להרגיש שיש מענה חי ואפשרות להגיב','להישען על מוכרות, רצף ומענה מוחשי','לעבד חוויה גם דרך שיחה, שאלה ושינוי נקודת מבט','לחוש הגנה ומשמעות של בית בתוך המענה','לקבל חום והכרה בחוויה האישית','להרגיש שהעזרה מותאמת לפרטים של מה שנחוץ','להחזיק הדדיות ומקום לשתי החוויות','לפתח אמון לפני שמרבים בחשיפה','למצוא פשר ואופק מעבר לרגע','לסמוך על מסגרת שיש בה אחריות ורצף','לשמור מקום לעמדה רגשית עצמאית ולעיבוד שאינו מוכתב מציפייה','לקבל רכות וקשב גם לחוויה שעדיין קשה להגדיר'];
function needs(model,participants){
 const order=people(model,participants),positions=order.map(i=>model.facts.find(f=>f.id===`pos:${i?'B':'A'}:Moon`));
 const [a,b]=order,[x,y]=positions;
 let text=`עבור ${model.names[a]}, עשוי להיות חשוב ${needWords[x.signIndex]}; עבור ${model.names[b]}, ${needWords[y.signIndex]}. `;
 if(x.signIndex===y.signIndex)text+='הגוון הסמלי המשותף אינו קובע מה כל אחד צריך ברגע מסוים. ';
 if(x.ownHouse.house===8&&y.ownHouse.house===8)text+='אצל שניהם, שאלות של אמון ומשמעות השיתוף עשויות לתת משקל רב לתגובה, גם כשהדרך לבטא אותה שונה. ';
 else if(x.ownHouse.house===8||y.ownHouse.house===8){const who=x.ownHouse.house===8?a:b;text+=`עבור ${model.names[who]}, שאלות של אמון ומשמעות השיתוף עשויות להוסיף משקל לתגובה קטנה לכאורה. `;}
 if(x.ownHouse.house===12||y.ownHouse.house===12){const who=x.ownHouse.house===12?a:b;text+=`עבור ${model.names[who]}, מרחב שקט לעיבוד עשוי להיות חלק מן ההתקרבות עצמה. `;}
 return text;
}
function social(model,participants,topic){
 const n=model.names;
 if(model.relationship==='הורה וילד'){
  const p=participants.findIndex(x=>x.role==='parent'),c=1-p;
  return {commitment:`${n[p]}, בתפקיד ההורה, אחראי למסגרת שאפשר להבין ולמענה שאינו מותנה בהרגעת ההורה. ${n[c]} אינו נדרש לספק להורה יציבות. תפקידי הכוכבים אינם משנים את האחריות הזאת.`,growth:`כאן האחריות לתיקון אינה סימטרית: ${n[p]} כהורה נדרש לברר מה הובן, להתאים את דרך ההתערבות ולאפשר ל${n[c]} להביע התנגדות בלי להפוך אותה לכישלון של הקשר.`,summary:`ההזדמנות להתפתחות היא ש${n[p]} יוכל להציב מסגרת ברורה ולהישאר סקרן כלפי חוויה שאינה תואמת את ציפייתו. התפקיד של ${n[c]} אינו ליישב את המתח עבור ההורה, אלא לקבל מקום לשאול, להרגיש ולפתח כיוון אישי. המפה אינה קובעת גיל או מידת תלות.`}[topic];
 }
 if(model.relationship==='אחים')return {commitment:'בקשר בין אחים, עקביות יכולה להתבטא במחווה חוזרת או בהסכם קטן שנשמר, בלי להפוך היסטוריה משפחתית לחובת זמינות או לחלוקת תפקידים קבועה.',growth:'אפשר לתת לעזרה צורה שמתאימה להווה, בלי להניח שמי שיזם או הרגיע בעבר חייב להמשיך למלא את אותו תפקיד.',summary:'הקרבה בין אחים יכולה לקבל צורה גמישה יותר כאשר משאירים מקום להיכרות מחודשת. אין צורך לפרש טעם שונה כהתרחקות מן המשפחה, או להסיק מי אמור להוביל מתוך סדר ההזנה; לא נמסרו גיל או בכורה.'}[topic];
 if(model.relationship==='חברות')return {commitment:'בחברות, אמינות נבנית גם דרך היקף עזרה שניתן לקיים; חברות אינה מחייבת זמינות בלתי מוגבלת.',growth:'בין חברים, תיקון יכול להיות הסכמה מחודשת על תדירות מפגש, סוג העזרה או הקצב של פעילות משותפת.',summary:'החברות יכולה להתבסס על שילוב של פעילות שיש בה עניין ושל אפשרות לומר מה אפשר לתת כעת. מרחב אישי אינו מחייב התרחקות, כל עוד אין צורך לנחש את תנאי המפגש בכל פעם מחדש.'}[topic];
 if(model.relationship!=='זוגיות')return 'האפשרויות המתוארות אינן מגדירות תפקיד או מחויבות שלא נמסרו; יש לברר את ציפיות שני האנשים בתוך סוג הקשר שבחרו.';
 return {commitment:'היכולת לבנות שותפות לאורך זמן תיבחן בדרך שבה העידוד והאחריות מקבלים ביטוי חוזר, ובהתאמת ההסכמות כאשר הצרכים משתנים.',growth:'בתוך זוגיות, מטרת הבירור אינה להגיע לתגובה זהה, אלא למצוא דרך שבה ההתקרבות אינה מוחקת את ההבדל בחוויה.',summary:'המשך ההתפתחות יכול להיבנות מהבחנה בין שלושה דברים: מה מעורר עניין, מה יוצר הרגשת ביטחון ומה אפשר לקיים לאורך זמן. כאשר נותנים לכל אחד מהם מענה, אין צורך לדרוש ממחווה אחת להוכיח את הקשר כולו.'}[topic];
}
function byFamily(bs,key,mode){return bs.find(b=>family(b)===key&&(!mode||b.mode===mode));}
function satOrientation(model,b){return {sat:endpoint(b,'Saturn'),other:[b.focal,b.counter].find(e=>e.body!=='Saturn')};}
export function commitment(model,participants,r){
 const bs=frames(model,r.items),n=model.names,full=bs.filter(b=>b.item.role!=='contextual'),context=bs.filter(b=>b.item.role==='contextual');
 if(r.part==='responsibility'){
  const sats=bs.filter(b=>endpoint(b,'Saturn')),merc=sats.find(b=>endpoint(b,'Mercury')),venus=sats.find(b=>endpoint(b,'Venus')),mars=sats.find(b=>endpoint(b,'Mars')),moon=sats.find(b=>endpoint(b,'Moon')),sun=sats.find(b=>endpoint(b,'Sun'));
  if(!sats.length)return 'הנתונים שנבחרו מאפשרים לדבר על דרכי עידוד, אך אינם נותנים כאן בסיס לתיאור מפורט של האופן שבו אחריות ומגבלה נחוות. זו מגבלת הכיסוי של הפרק, ולא מסקנה שאין בקשר אמינות או התמדה.';
  let text='';
  if(venus){const {sat,other}=satOrientation(model,venus);text=venus.mode==='resource'?`אמינות עשויה להיבנות דרך מחוות שאפשר לחזור אליהן. עבור ${n[other.person]}, עקביות מצד ${n[sat.person]} יכולה לתת להערכה משקל: יש ערך גם למשהו קטן שנשמר, ולא רק להבטחה מרשימה. ההשפעה הזאת אינה מחייבת התלהבות גלויה בכל רגע; היא מציעה אפשרות להרגיש שהחיבה אינה נעלמת עם שינוי במצב הרוח.`:venus.mode==='tension'?`הצורך של ${n[sat.person]} ברצינות ובעקביות עלול לפגוש אצל ${n[other.person]} תחושה שמחווה צריכה לעמוד בתנאי לפני שתתקבל. אמינות נבנית כאן כאשר אחריות אינה הופכת להתניה של ההערכה.`:`מחווה יכולה לשאת משקל גדול של התחייבות עבור ${n[other.person]} במפגש עם ${n[sat.person]}. הדבר עשוי לעזור להתמיד, אך גם להפוך רגע של קלות או שינוי בטעם לשאלה גדולה מדי על רצינות הקשר.`;}
  if(merc){const {sat,other}=satOrientation(model,merc);const s=merc.mode==='tension'?`אותה רצינות יכולה לקבל גוון אחר בשיחה. עבור ${n[other.person]}, הרצון לדייק או להבהיר עלול לפגוש את התגובה של ${n[sat.person]} כחסם, כתיקון מוקדם או כציפייה לדעת מראש. חשוב להבחין בין הסכם ברור לבין מצב שבו עצם העלאת השאלה נעשית מבחן.`:merc.mode==='resource'?`אפשר להיעזר בבירור מסודר כדי לתת לאחריות צורה מובנת. עבור ${n[other.person]}, האפשרות לנסח שאלה או לחזור על פרט יכולה לפגוש אצל ${n[sat.person]} סבלנות לרצף; כך הסכמה אינה נשארת רעיון מופשט, אלא נעשית משהו שאפשר לבדוק ולעדכן.`:`למילים ולהסכמים עשוי להיות משקל רב. עבור ${n[other.person]}, המפגש עם ${n[sat.person]} עשוי לעודד חשיבה רצינית וגם להקשות על ניסוי או שינוי עמדה.`;text+=(text?' ':'')+s;}
  if(!text&&(mars||sun||moon)){const b=mars??sun??moon,{sat,other}=satOrientation(model,b);const aim=other.body==='Mars'?'הקצב שבו פועלים':other.body==='Moon'?'האופן שבו מבקשים ביטחון':'הזכות לפתח כיוון אישי';text=`האחריות מקבלת משמעות דרך ${aim}. עבור ${n[other.person]}, המפגש עם ${n[sat.person]} ${b.mode==='resource'?'יכול להציע מסגרת שמאפשרת להסתמך על רצף':'עשוי להעמיד את הצורך להתקדם מול תחושה שצריך להאט, להסביר או להוכיח מוכנות'}. ${b.mode==='tension'?'הלמידה האפשרית היא להגדיר משימה שאפשר לשאת, במקום להרחיב את הדרישה עד שהיא נעשית הערכה של האדם כולו.':'גם כאשר יש נכונות להשקיע, כדאי להבחין בין החלטה מסוימת לבין ציפייה קבועה.'}`;}
  if(context.length&&full.filter(b=>endpoint(b,'Saturn')).length===0)text+=' אלה סימנים מתונים לאופן שבו אפשר לבנות רצף, ולא בסיס לקביעה שהמסגרת כבר יציבה. המגעים הרחבים יותר נשמרים במקורות, והם אינם הופכים את התיאור המצומצם הזה להערכה כוללת של המחויבות.';
  return text;
 }
 if(r.part==='support'){
  const jups=bs.filter(b=>endpoint(b,'Jupiter')),jm=jups.find(b=>endpoint(b,'Moon')),js=jups.find(b=>endpoint(b,'Sun')),ja=jups.find(b=>endpoint(b,'Mars'));
  let text='';
  if(jm){const j=endpoint(jm,'Jupiter'),m=endpoint(jm,'Moon');text=jm.mode==='resource'?`התמיכה יכולה להתחיל מהרגשה שיש מעבר לרגע הקשה. ${n[j.person]} עשוי להציע ל${n[m.person]} אופק רחב יותר, כשהעידוד מצטרף להכרה ברגש. כך אפשר לחזור לפעולה בלי לדרוש שהרגישות תיעלם קודם.`:`הרצון של ${n[j.person]} לעודד עלול להגיע לפני שהחוויה של ${n[m.person]} קיבלה מקום. אמון מתפתח כאשר התקווה אינה מחליפה הכרה בקושי.`;}
  if(ja){const j=endpoint(ja,'Jupiter'),m=endpoint(ja,'Mars');text+=(text?' ':'')+`כאשר העידוד של ${n[j.person]} פוגש את היוזמה של ${n[m.person]}, הוא עשוי להגדיל את הנכונות לנסות. ${ja.mode==='tension'?'ההתרחבות יכולה גם להגדיל את הפער בין התוכנית ליכולת לבצע.':'דווקא האפשרות להתרחב מחייבת לבחור למה מתחייבים כעת, כדי שהתלהבות לא תיצור עומס שקשה לשאת.'}`;}
  if(js){const j=endpoint(js,'Jupiter'),s=endpoint(js,'Sun');text+=(text?' ':'')+`בכיוון שבו ${n[j.person]} מגיב לביטוי האישי של ${n[s.person]}, ${js.mode==='resource'?'הכרה יכולה לעודד התפתחות ולתת ערך גם לדרך ולא רק לתוצאה':'יש מקום לבדוק אם הציפייה להתפתח תואמת את הכיוון האישי ואת המשאבים בפועל'}.` ;}
  if(!text)text='העידוד אינו מתואר כאן מתוך ערוץ רחב מספיק כדי לקבוע כיצד הוא פועל לאורך זמן. אפשר לבחון את דרכי התמיכה שבממצאים האחרים, בלי להשלים מהן הבטחה לאופטימיות או להתרחבות משותפת.';
  return text;
 }
 const structural=r.items.flatMap(i=>associatedRulers(model,i).map(x=>({...x,item:i}))),h4=structural.find(x=>x.house===4),h7=structural.find(x=>x.house===7);
 let text=h4&&h7&&h4.person===h7.person?`עבור ${n[h4.person]}, השייכות וההסכמות נוגעות זו בזו: תגובה שמעניקה ביטחון והדרך שבה משתתפים בקשר עשויות לקבל משמעות רחבה מן הרגע. לכן יש ערך להבחין בין הצורך להרגיש בבית לבין מה שסוכם לעשות יחד.`:h4&&h7?`תחושת בסיס בטוח והאופן שבו יוצרים הסכמות נפגשים כאן, אך אינם אותה משימה. עבור ${n[h4.person]}, מענה בתוך תחום השייכות עשויה לשאת משמעות רחבה מן הרגע עצמו; עבור ${n[h7.person]}, דרך ההשתתפות נוגעת גם לשאלה כיצד מתקיימת שותפות. לכן כדאי לתת להבטחה צורה יומיומית: מה אפשר לקיים, מה מצריך בירור ומתי חוזרים לעדכן.`:h4?`היכולת להסתמך על הקשר נוגעת גם לשייכות עבור ${n[h4.person]}. אין צורך לדרוש מכל מפגש אישור כולל לביטחון; רצף יכול להיבנות מסדרה של תגובות מובנות, ובהן גם האפשרות לתקן אי־הבנה.`:'הסכמה קטנה שנשמרת יכולה לבנות יותר אמון מהצהרה רחבה שקשה לעמוד בה. המחויבות נבחנת גם ביכולת לעדכן את היקף העזרה והעשייה כאשר המצב משתנה.';
 return text+' '+social(model,participants,'commitment');
}
function pairMeaning(model,t,s){
 const n=model.names,tf=family(t),sf=s&&family(s);
 if(tf==='Mercury|Saturn'&&s&&sf==='Saturn|Venus'){
  const sat=endpoint(t,'Saturn'),m=endpoint(t,'Mercury'),v=endpoint(s,'Venus');
  return `יש כאן הבדל בין היכולת להרגיש שמעריכים לבין החופש לנסח ספק. ${n[sat.person]} עשוי להציע ל${n[v.person]} רצף והערכה דרך מעשים, ובכל זאת השיחה עם ${n[m.person]} עלולה להיעשות זהירה מדי כאשר עולה צורך לתקן. המשאב המסוים הוא אמינות במחווה; אפשר להיעזר בו כדי להשאיר מקום גם לשאלה שעדיין אינה מנוסחת היטב. כך היציבות תומכת בבירור במקום להפוך את עצם הבירור לאיום על היציבות.`;
 }
 if(tf==='Moon|Pluto'&&s){const m=endpoint(t,'Moon'),p=endpoint(t,'Pluto');return `הרצון להבין לעומק עשוי להיות משמעותי עבור ${n[p.person]}, ובו בזמן מציף עבור ${n[m.person]}. ${sf==='Jupiter|Moon'?'האפשרות להחזיר אופק ולהעניק עידוד מציעה דרך לצאת מן הצורך לפרש כל תגובה עד תומה':'המשאב שנמצא במענה הרגשי מאפשר לשוב למפגש דרך הקשבה וקצב אחר'}. זה אינו פתרון של העומק באמצעות קלילות: ההבדל הוא בין נוכחות שנשארת לצד הרגש לבין ניסיון להשיג מיד הסבר מלא. אפשר להתחיל מהכרה במה שהורגש, ורק אחר כך לבדוק אם יש נכונות להבין יותר.`;}
 if(tf==='Moon|Neptune'&&s){const m=endpoint(t,'Moon'),ne=endpoint(t,'Neptune');return `הרגישות לאווירה יכולה לגרום ל${n[m.person]} להישאר עם שאלה שלא נאמרה, בעוד המשמעות שנחוותה במפגש עם ${n[ne.person]} אינה בהכרח המשמעות שהתכוונו להעביר. ${sf==='Moon|Sun'?'האפשרות לחבר כיוון אישי למענה רגשי מציעה בירור פשוט יותר: מה חשוב כעת, ומה יעזור להתקדם בלי לדלג על ההרגשה':'המגע התומך מציע לחזור לתגובה שאפשר לזהות, במקום להישען על התרשמות בלבד'}. הצמיחה היא ביכולת לבדוק תחושה בלי לבטל אותה, וביכולת לשאת תשובה שונה מן הניחוש.`;}
 if(tf==='Mars|Pluto'&&s&&sf==='Mars|Mars'){const m=endpoint(t,'Mars'),p=endpoint(t,'Pluto');return `הנחישות של ${n[m.person]} יכולה להפוך למאבק על הדרך במפגש עם ${n[p.person]}, אך קיימת גם אפשרות לתאם פעולה ממשית. לכן המשאב אינו רק רצון טוב: הוא היכולת לנסות צעד משותף ולראות כיצד שני קצבי הפעולה משתלבים. בחירה במשימה מוגדרת מאפשרת להבחין בין קושי ביחסי ההשפעה לבין יכולת לעבוד יחד. הצלחה בצעד אחד יכולה ללמד מה עוזר לתיאום, בלי להפוך אותה לדרישה להסכים על כל המשך.`;}
 if(tf==='Pluto|Sun'&&s&&sf==='Jupiter|Sun'){const sun=endpoint(t,'Sun'),p=endpoint(t,'Pluto'),j=endpoint(s,'Jupiter');return `עבור ${n[sun.person]}, הרצון לפתח כיוון אישי עשוי לפגוש אצל ${n[p.person]} מעורבות חזקה, שמורגשת לעיתים גם כציפייה לשינוי. העידוד מצד ${n[j.person]} מציע אפשרות אחרת: להכיר ביכולת לצמוח בלי להכתיב מראש את התוצאה. השילוב מזמין להבחין בין תמיכה בהתפתחות לבין ניסיון להגדיר מה היא צריכה להיות. יעד משותף יהיה מועיל יותר אם יישאר בו מקום לבחירה אישית בדרך.`;}
 if(tf==='Mars|Venus'&&s&&sf==='Mars|Venus')return `הפנייה והתגובה אינן זורמות באותה דרך בשני הכיוונים. מה שמתקבל בנעימות כאשר אחד מציע, יכול להרגיש מהיר או לא מדויק כאשר התפקידים מתחלפים. המשאב הוא היכרות עם דרך התקרבות שעובדת עבור אחד מהם; הלמידה היא לא להעתיק אותה לאחר, אלא לברר איזו מחווה ואיזה עיתוי מתאימים לו. כך ההבדל נעשה מידע על שני אנשים, במקום הוכחה שרק אחד יודע להיענות.`;
 if(tf==='Sun|Venus'&&s){const sun=endpoint(t,'Sun'),v=endpoint(t,'Venus');return `ההבדל בין הרצון של ${n[sun.person]} לבין דרך ההערכה של ${n[v.person]} יכול ליצור רגע שבו מחווה נעימה אינה נותנת תחושה שרואים את הכיוון האישי. ${channel(s.item)==='emotions'?'המענה הרגשי התומך מציע להתחיל מהחוויה ורק אחר כך לבדוק מה היה חסר במחווה':'התיאום הזמין בתחום אחר מאפשר לשוב לשיחה אחרי עשייה או מפגש מוצלחים, בלי לדרוש שהם יפתרו את ההבדל בעצמם'}. שינוי מועיל יהיה מעבר משאלה מי השקיע יותר לשאלה איזו משמעות כל אחד ביקש להביא למפגש.`;}
 if(tf==='Moon|Uranus'&&s){const m=endpoint(t,'Moon'),u=endpoint(t,'Uranus');return `עבור ${n[m.person]}, שינוי בקצב או בזמינות עלול לקבל משמעות רגשית, בעוד המפגש עם ${n[u.person]} מביא גם צורך בחופש לשנות את הדרך. האפשרות להיענות דרך עשייה מציעה עוגן שאינו מחייב נוקשות: לתאם משהו מוגדר ולהשאיר מרחב לעדכון. כך שינוי אינו חייב להיתפס כהיעלמות, והצורך ברצף אינו נעשה דרישה להישאר תמיד באותה צורה.`;}
 if(tf==='Mercury|Uranus'&&s){const m=endpoint(t,'Mercury');return `היכולת להעלות אפשרות מפתיעה יכולה להעשיר שיחה, אך עבור ${n[m.person]} היא עלולה גם לשבור את רצף הבירור לפני שנוצרה הבנה. המשאב התומך מציע לתת לרעיון מקום דרך הכרה בכיוון האישי, ולא רק דרך התלהבות מן החידוש. אפשר לסיים בירור של נקודה אחת ואז להחליט יחד אם לשנות את המסלול; כך גמישות אינה מחליפה הקשבה.`;}
 if(tf==='Mercury|Moon'&&s){const m=endpoint(t,'Moon'),me=endpoint(t,'Mercury');return `השיחה עשויה לעזור ל${n[me.person]} להבין ולארגן, ובאותו זמן להשאיר את ${n[m.person]} עם צורך שעדיין לא קיבל הכרה. הרחבת המבט והיכולת לראות כמה אפשרויות יכולות לסייע, אם אינן הופכות להסבר מדוע אין צורך להרגיש כפי שמרגישים. השילוב מזמין להקשיב תחילה למה שנחווה, ורק אחר כך להשתמש ברוחב המחשבה כדי למצוא מענה. כך ההבנה נעשית כלי לתמיכה ולא תחליף לה.`;}
 if(tf==='Mercury|Saturn'&&s){const m=endpoint(t,'Mercury'),sa=endpoint(t,'Saturn');return `הצורך של ${n[sa.person]} במסגרת והצורך של ${n[m.person]} להסביר עשויים להיפגש דרך רצינות, אך גם ליצור תחושה שצריך להגיע מיד לניסוח הנכון. העידוד שנמצא לביטוי אישי מציע להפוך את הבירור לתהליך למידה, במקום למבחן מוכנות. הסכם יהיה ברור יותר אם ניתן לשאול עליו ולתקן הבנה, ולא רק לחזור על הדרישה בעוצמה גדולה יותר.`;}
 if(tf==='Mars|Saturn'&&s){const ma=endpoint(t,'Mars'),sa=endpoint(t,'Saturn');return `היוזמה של ${n[ma.person]} עלולה להיעצר מול הצורך של ${n[sa.person]} בקצב או במסגרת אחרים. לצד החיכוך קיימת אפשרות לתת לרצון צורה מעשית, ולכן אין צורך לבחור בין הפעלת לחץ לבין ויתור על עשייה. אפשר להתאים את גודל הצעד, להבהיר מה צפוי ולבדוק היענות לפני שמרחיבים את המשימה. כך פעולה משותפת יכולה לשאת הבדל במוכנות במקום להציג אותו כהתנגדות לאדם.`;}
 if(tf==='Mars|Moon'&&s){const m=endpoint(t,'Moon'),ma=endpoint(t,'Mars');return `מה שמתחיל אצל ${n[ma.person]} כרצון להגיב ולעשות עלול להגיע אל ${n[m.person]} לפני שניתן זמן לעבד את החוויה. התיאום בין רצון לפעולה מציע להשתמש בעשייה כאשר היא מצטרפת לצורך שנאמר, ולא כאשר היא ממהרת להחליף אותו. שאלה פשוטה על סוג העזרה הרצוי יכולה לחבר בין נכונות לפעול לבין הרגשה שמקשיבים, ולהקטין את הצורך להיאבק על עצם הזכות להגיב בקצב אחר.`;}
 if(tf==='Mars|Sun'&&s){const su=endpoint(t,'Sun'),ma=endpoint(t,'Mars');return `התנופה של ${n[ma.person]} יכולה לעורר את הכיוון האישי של ${n[su.person]}, אך גם להתחרות בו. המשאב שנמצא במענה דרך עשייה מראה שאותה אנרגיה יכולה לפעול כתמיכה כאשר מטרתה ברורה ומוסכמת. הבירור המועיל הוא מה מבקשים לקדם ולמי יש צורך להציע כיוון אחר. כך ההשתתפות נעשית אפשרות בעלת משמעות, ולא הוכחה שחייבים לנוע יחד בכל רגע.`;}
 const a=n[t.focal.person],b=n[t.counter.person];
 const route={communication:'להפריד בין מה שנאמר לבין הפירוש שניתן לו, ולוודא שהשאלה הובנה לפני שמגבירים את ההסבר',emotions:'להפריד בין זמן להרגיש לבין זמן לפתרון, ולברר איזו נוכחות נחוצה בכל שלב',affection:'לברר כיצד התקבלה מחווה מסוימת במקום להסיק על החיבה כולה',action:'להגדיר צעד שניתן לנסות ולבדוק אותו לפני שמגדילים את ההיקף',direction:'לנסח יעד משותף לצד מרחב לכיוון אישי'}[channel(t.item)];
 return `הפער בין החוויה של ${a} לבין דרך המענה של ${b} יכול להתבהר כאשר בוחנים מצב מסוים במקום להגדיר את הקשר כולו באמצעותו. ${s?'האפשרות לתיאום שנמצאה אינה מוחקת את המתח, אך מאפשרת לנסות תגובה אחרת כשיש די ביטחון לחזור אל הנושא.':'אין צורך להשלים את הכיסוי המצומצם באמצעות הבטחה לפתרון שלא עולה מן הממצאים.'} אפשר ${route}.`;
}
export function growth(model,participants,r){
 const bs=frames(model,r.items),t=bs.find(b=>b.mode==='tension'),s=bs.find(b=>b.mode==='resource');
 if(t)return pairMeaning(model,t,s);
 if(s){const n=model.names;return `אפשרות ההתפתחות מתחילה דווקא במה שניתן לעשות יחד. עבור ${n[s.focal.person]} ועבור ${n[s.counter.person]}, התיאום יכול לקבל צורה של הרגל קטן: זמן לשיחה, פעילות שנבחרה או עזרה שמותאמת לבקשה. אין צורך להמתין למשבר כדי לבדוק אם הדרך הזאת ממשיכה להתאים; משאב נעשה משמעותי כאשר אפשר לשנות את צורתו בלי לאבד את הרצף.`;}
 return 'הממצאים שבפרק אינם מאפשרים לבנות כאן הסבר רחב של מתח ומשאב. זו מגבלת הפרשנות, ולא קביעה שאין בקשר אפשרויות להתפתחות.';
}
export function growthEnd(model,participants){return social(model,participants,'growth');}
export function summary(model,participants,r){
 const relational=relationshipSummary(model,participants,r);if(relational!==undefined)return relational;
 const bs=frames(model,r.items),n=model.names,[a,b]=people(model,participants),pair=r=>byFamily(bs,r),hardMoon=byFamily(bs,'Moon|Pluto','tension'),ambiguous=byFamily(bs,'Moon|Neptune','tension'),marsShared=byFamily(bs,'Mars|Mars','resource'),mercurySat=byFamily(bs,'Mercury|Saturn','tension'),want=bs.filter(b=>family(b)==='Mars|Venus'),rulers=model.facts.filter(f=>f.kind==='ruler'&&f.quality!=='cusp-sign-sensitive');
 if(r.part==='character'){
  let text;
  if(model.relationship==='הורה וילד'){
   const p=participants.findIndex(x=>x.role==='parent'),c=1-p;
   text=mercurySat?`הקשר בין ${n[p]} ל${n[c]} מציב במרכז את האפשרות לחבר מסגרת עם התפתחות של קול אישי. הסבר או הנחיה יכולים להעניק סדר, ובכל זאת להיחוות כמצמצמים כאשר אין די מקום לשאלה או לתגובה שונה. אין להטיל על ${n[c]} אחריות ליציבות הקשר בגלל הרצינות המופיעה במפגש; היא מדגישה כמה חשוב שההורה יהפוך ציפייה למשהו שאפשר להבין ולדון בו.`:`הקשר בין ${n[p]} ל${n[c]} יכול להציע מקום להתפתחות כאשר התמיכה מותאמת לאופן שבו החוויה נקלטת. מסגרת אינה צריכה לדרוש זהות ברצון או בתגובה כדי לתת ביטחון.`;
  }else if(model.relationship==='אחים'&&byFamily(bs,'Sun|Venus','tension'))text=`בין ${n[a]} ל${n[b]}, הקרבה יכולה לשאת משמעות של שייכות לצד הבדלים בדרך שבה רוצים לקבל הכרה. הרצון להרגיש שרואים את הכיוון האישי אינו תמיד נענה במחווה שהאחר מביא. משום כך, דווקא מוכרות עלולה לעודד קיצור דרך: להניח שכבר יודעים מה ישמח או ירגיע. האפשרות להמשיך להתקרב נמצאת בהיכרות עם ההבדל, ולא בדרישה לשמר תגובה משפחתית אחידה.`;
  else if(model.relationship==='אחים')text=`בין ${n[a]} ל${n[b]}, האפשרות להכיר מחדש את דרך התגובה של האחר יכולה להרחיב קשר משפחתי מעבר להרגלים מוכרים. ההקשר המשפחתי אינו מחייב ציפייה זהה מן המפגש, ואפשר לברר מה נותן לכל אחד תחושת שייכות כעת.`;
  else if(model.relationship==='חברות')text=`החברות בין ${n[a]} ל${n[b]} יכולה לקבל חיות מעשייה משותפת, אך היא נבחנת גם במה שקורה כאשר ההתלהבות פוגשת קצב אחר או התחייבות מעשית. רצון להשתתף אינו תמיד רצון באותו היקף של פעילות. הקרבה יכולה להתחזק כאשר יש מקום להתלהבות וגם להודעה ברורה על מה אפשר לקיים כעת.`;
  else if(want.length>=2&&new Set(want.map(b=>b.mode)).size>1)text=`הקשר בין ${n[a]} ל${n[b]} עשוי לחבר עניין, חיבה ורצון להתקרב, אך אותה התקרבות אינה נחווית באופן זהה בשני הכיוונים. אפשר שאחד ימצא דרך יוזמה שנעימה לאחר, ובכל זאת יזדקק בעצמו למחווה אחרת כשהוא מבקש להיענות. לכן איכות המפגש אינה תלויה רק בעוצמת העניין, אלא גם ביכולת להכיר בדרך המסוימת שבה כל אחד מרגיש רצוי.`;
  else if(marsShared)text=`בין ${n[a]} ל${n[b]} יש אפשרות למצוא שפה משותפת דרך עשייה: להתנסות, לבנות תנופה ולגלות כיצד מגיבים למשהו ממשי. היכולת הזאת אינה דורשת שכל ההרגשות יהיו ברורות מראש, אך היא גם אינה מסבירה את כולן. ההזדמנות היא לתת לחוויה משותפת ליצור היכרות, בלי להפוך תיאום בפעולה להנחה שכבר הושג תיאום בכל רובדי הקשר.`;
  else text=`הקשר בין ${n[a]} ל${n[b]} מציע כמה דרכי מפגש, שלכל אחת מהן תנאים אחרים. אפשר לחוות חיבה, לרצות לעזור ולהתקשות להבין תגובה מסוימת בלי שאחת החוויות תבטל את האחרות. ההיכרות מעמיקה כאשר ההבדל נעשה נושא לשיחה ולא הסבר כולל לאופיו של האדם.`;
  if(model.relationship==='זוגיות'&&want.some(x=>x.mode==='resource')&&want.some(x=>x.mode==='tension')){const good=want.find(x=>x.mode==='resource'),hard=want.find(x=>x.mode==='tension'),gm=endpoint(good,'Mars'),gv=endpoint(good,'Venus'),hm=endpoint(hard,'Mars'),hv=endpoint(hard,'Venus');text+=` ביוזמה של ${n[gm.person]} יש אפשרות להיענות שמשתלבת בהעדפה של ${n[gv.person]}; כאשר ${n[hm.person]} יוזם מול ההעדפה של ${n[hv.person]}, נדרש יותר תיאום של הדרך והעיתוי.`;}
  const recognition=byFamily(bs,'Sun|Venus');
  if(model.relationship==='זוגיות'&&recognition){const su=endpoint(recognition,'Sun'),ve=endpoint(recognition,'Venus');text+=recognition.mode==='resource'?` ההערכה מצד ${n[ve.person]} יכולה לתת לביטוי האישי של ${n[su.person]} מקום בתוך המפגש, ולהוסיף לעשייה גם הרגשה של רצויות.`:recognition.mode==='tension'?` גם כאשר יש עניין, דרך המחווה של ${n[ve.person]} אינה בהכרח הדרך שבה ${n[su.person]} מבקש לראות את הכיוון האישי שלו מקבל מקום.`:'';}
  return text;
 }
 if(r.part==='needs'){
  let text=needs(model,participants);
  if(hardMoon){const m=endpoint(hardMoon,'Moon'),p=endpoint(hardMoon,'Pluto');text+=`משום כך, הרצון של ${n[p.person]} להכיר לעומק עלול להגיע אל ${n[m.person]} בעוצמה גדולה מן הרצוי באותו רגע. קרבה יכולה להיבנות כאשר יש רשות להישאר בחוויה לפני שמחפשים לה פירוש, והעניין ההדדי אינו תלוי בכמות המידע שנמסר.`;}
  else if(ambiguous){const m=endpoint(ambiguous,'Moon');text+=`כאשר עבור ${n[m.person]} האווירה מעוררת שאלה שלא נאמרה, תגובה ברורה יכולה להיות משמעותית יותר מניסיון לנחש נכון. הקושי אינו בהכרח חוסר אכפתיות, אלא אפשרות ששני האנשים משלימים לעצמם משמעות אחרת לאותו רגע.`;}
  else text+='ההבדל בין סגנונות המענה מאפשר להפריד בין הכוונה לעזור לבין העזרה שמתקבלת בפועל. הוא אינו מחייב להפוך כל אי־התאמה לסימן של התרחקות.';
  return text;
 }
 let text='';
 const satMerc=byFamily(bs,'Mercury|Saturn','tension'),satVenus=bs.find(x=>family(x)==='Saturn|Venus'&&x.mode==='resource'),jm=byFamily(bs,'Jupiter|Moon','resource'),mp=byFamily(bs,'Mars|Pluto','resource');
 if(satMerc&&satVenus&&sameNode(satMerc,satVenus)){const s=endpoint(satMerc,'Saturn');text=`אחד החיבורים החשובים בתמונה הוא שהרצינות של ${n[s.person]} יכולה להיות גם מקור לאמינות במחווה וגם סיבה לזהירות בדיבור. מכאן שהפתרון אינו פחות אכפתיות או פחות אחריות, אלא אחריות שמשאירה מקום לספק ולתיקון. `;}
 else if(marsShared&&bs.some(x=>family(x)==='Mars|Pluto'&&x.mode==='tension'))text='היכולת לפעול יחד יכולה לשמש מרחב ללמידה על יחסי ההשפעה: לבדוק היכן התיאום נעשה קל יותר, ומתי הנחישות הופכת לניסיון לקבוע את הדרך עבור האחר. כך ההצלחה המעשית אינה מסתירה את הקושי, אלא מספקת דרך לעבוד עליו. ';
 else if(jm||mp)text='אפשר להישען על היכולת לעודד או להישאר בעשייה משותפת, ובו בזמן להכיר בכך שהתמיכה אינה מספקת מאליה את המענה הרגשי המדויק. הרצף נבנה כאשר בודקים מה עזר ומה זקוק לצורה אחרת. ';
 else if(model.relationship==='הורה וילד'&&byFamily(bs,'Jupiter|Sun','resource')){const js=byFamily(bs,'Jupiter|Sun','resource'),j=endpoint(js,'Jupiter'),su=endpoint(js,'Sun');text=`יש גם מקום לעידוד שמרחיב את הביטוי האישי: ${n[j.person]} יכול להציע ל${n[su.person]} הכרה באפשרות להתפתח, במקום למדוד רק את העמידה בציפייה הנוכחית. החיבור בין תמיכה לבין מסגרת יהיה פורה כאשר ההכוונה מאפשרת להתנסות ולנסח עמדה, ולא רק להגיע לתשובה הרצויה. `;}
 else text='ההבדלים אינם דורשים מסקנה כוללת על סיכויי הקשר. הם מציעים לבחון איך אפשר להחזיק עניין ונפרדות, תמיכה ותיקון, בתוך מפגש שמתפתח. ';
 // Link only actual participating relevant rulers; no inference from a house number alone.
 const linked=r.items.flatMap(i=>associatedRulers(model,i)),h4=linked.find(x=>x.house===4),h7=linked.find(x=>x.house===7);
 if(model.relationship==='זוגיות'&&h4&&h7)text+=`כאשר עבור ${n[h4.person]} המחווה נוגעת גם בתחושת הבסיס והשייכות, ועבור ${n[h7.person]} היוזמה נושאת גם משמעות של שותפות, חשוב לברר לא רק מה עושים אלא מה כל אחד מבקש לבנות באמצעות המפגש. `;
 const commitments=r.items.filter(i=>i.topic==='commitment');if(commitments.length&&!commitments.some(i=>i.central||i.role==='reinforcing'))text+='התמונה מאפשרת להתייחס לדרך שבה מנסחים הסכמות, אך משאירה פתוחה את שאלת הרצף לאורך זמן. כיסוי מצומצם אינו מלמד שאמינות או התמדה חסרות בקשר. ';
 if(model.relationship==='זוגיות'&&satMerc&&satVenus&&sameNode(satMerc,satVenus))return text+'שותפות יכולה להעמיק כאשר האמינות אינה דורשת ניסוח מושלם, והחיבה יכולה ללוות גם בירור שעדיין לא הסתיים. כך יש מקום גם לעומק וגם לקצב אישי בתוך הרצון להיות יחד.';
 if(model.relationship==='זוגיות'&&marsShared&&bs.some(x=>family(x)==='Mars|Pluto'&&x.mode==='tension'))return text+'ברגע של אי־בהירות, תשובה פשוטה על מה שהורגש ועל מה שאפשר לקיים עשויה להועיל יותר מהגברת המאמץ. כך נוצר חיבור בין יכולת לעשות יחד לבין היכולת להכיר במה שעדיין לא ברור לשני האנשים.';
 return text+social(model,participants,'summary');
}
