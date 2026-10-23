import {interactionSynthesis} from './interactions.mjs';
import {pointInfo} from '../../../synastry.mjs';
import {signStyles,bodyFunctions} from '../lexicon.mjs';
import {houseContexts} from '../../content.mjs';
const topics={communication:'תקשורת',emotions:'רגשות'};
const themes={
 Sun:{title:'לתת מקום לקול אישי',tension:'הבירור עלול להישמע כערעור על זכותו של האחר לרצות דבר מסוים',resource:'אפשר לתת הכרה לאדם ובו בזמן לברר את רצונו',blend:'הביטוי האישי והתגובה אליו מתקרבים, ולכן חשוב להשאיר גם מקום לתשובה שונה'},
 Moon:{title:'להכיר בשני קצבי תגובה',tension:'הבדל בהרגלי ההרגעה יכול להיחוות כהיעדר הבנה גם כששני האנשים מבקשים ביטחון',resource:'היכרות עם הרגלי התגובה יכולה לסייע ביצירת רצף נעים',blend:'התגובה המיידית עשויה להיות מוכרת מאוד, אך מוכרות אינה מבטיחה צורך זהה'},
 Mercury:{title:'כשהמילים פוגשות את החוויה',tension:'הסבר יכול להיות נכון מבחינת הדובר ובכל זאת להחמיץ את מה שהאחר מנסה למסור',resource:'ניסוח משותף יכול לתת לחוויה צורה שאפשר לשוב ולברר',blend:'החוויה והניסוח מתקרבים עד שקשה לפעמים להבדיל בין מה שהורגש לבין ההסבר שניתן לו'},
 Venus:{title:'מחווה נעימה והעדפה אישית',tension:'רצון לשמור על נועם עלול לדחות אמירה של העדפה אחרת',resource:'מחווה קטנה והכרה בהעדפות יכולות לפתוח מקום להקשבה',blend:'ההעדפה והצורך במענה כרוכים זה בזה, בלי להבטיח שאותה מחווה מתאימה לשניהם'},
 Mars:{title:'המעבר מתגובה לפעולה',tension:'יוזמה מהירה עלולה להקדים את הבירור שהאחר עדיין זקוק לו',resource:'עשייה יכולה לתת מענה מוחשי לדבר שקיבל קודם מילים או הכרה',blend:'הדחף לפעול והצורך להגיב מופיעים יחד, ולכן דרושה הבחנה בין רצון לעזור לבין רשות לפעול'},
 Jupiter:{title:'מרחב רחב שאינו מדלג על הפרטים',tension:'מבט רחב עלול להפוך להסבר גדול מדי לפני שהקושי המסוים הובן',resource:'פרספקטיבה רחבה יכולה להשאיר מקום לתקווה בלי לדרוש שהקושי ייעלם',blend:'אמון והרחבת אפשרויות נקשרים למענה המיידי, ולכן כדאי לבדוק מה עדיין בגדר הבטחה'},
 Saturn:{title:'רצינות בלי בחינה של האדם',tension:'מסגרת ובדיקה עלולות להיעשות תנאי שמקשה להעלות מחשבה או תחושה לא גמורה',resource:'עקביות וסבלנות עשויות לאפשר לחזור לנושא גם אחרי אי־הסכמה',blend:'האחריות נקשרת ישירות למענה, ויכולה לספק אחיזה או להכביד אם כל תגובה נעשית חובה'},
 Uranus:{title:'מרחב לשינוי עם רצף ברור',tension:'שינוי מסגרת יכול לפתוח אפשרות חדשה ובאותו זמן לערער את תחושת הרצף אצל האחר',resource:'פתיחות לניסיון שונה יכולה להוציא את המפגש ממענה שחוזר על עצמו',blend:'החידוש נעשה חלק מן המענה עצמו, ולכן כדאי להבהיר מה משתנה ומה עדיין נשמר'},
 Neptune:{title:'רגישות שמשאירה מקום לבדיקה',tension:'קל לקלוט גוון או רמז ולייחס להם משמעות שלא נשאלה',resource:'דמיון וקשב לאווירה יכולים לסייע כשאין עדיין ניסוח שלם',blend:'הקרבה למה שאינו נאמר עשויה להיות עמוקה, אך אינה מעניקה ידיעה ודאית של החוויה האחרת'},
 Pluto:{title:'עומק עם רשות לעצור',tension:'הרצון להגיע לעומק עלול להפוך עוד חשיפה להוכחה של אמון',resource:'אפשר להישאר לצד נושא מורכב בלי להסתפק בתשובה מהירה',blend:'הניסוח או הצורך במענה נוגעים במישרין בשאלות של חשיפה והשפעה, כך שהקשבה דורשת גם גבול לשאלות'},
};
const aspectWords={conjunction:'בצמידות ל',opposition:'במולות ל',square:'בריבוע ל',trine:'במשולש ל',sextile:'במשושה ל'};
export function composeSynthesis(model,participants,plan){
 const index=new Map(model.facts.map(f=>[f.id,f])),pid=i=>i?'B':'A',pos=(i,b)=>index.get(`pos:${pid(i)}:${b}`),overlay=(i,b)=>index.get(`overlay:${pid(i)}:${b}:in:${pid(1-i)}`),name=i=>model.names[i],body=b=>pointInfo[b][0];
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));
 const family=model.relationship==='הורה וילד',friend=model.relationship==='חברות',siblings=model.relationship==='אחים';
 const parent=family?participants.findIndex(p=>p.role==='parent'):null,child=family?1-parent:null;
 const ledger=new Map(),describedRulers=new Set(),rulerPlacements=new Set(),functionContexts=new Set(),described=new Set(),chapters=[],trace=[],addConcept=(key,chapter,refs)=>{if(ledger.has(key))throw Error('Duplicate semantic claim: '+key);ledger.set(key,{chapter,evidenceIds:[...new Set(refs)]});};
 function point(i,b){const p=pos(i,b),key=participants[i].id+':'+b;
  if(described.has(key))return `${body(b)} של ${name(i)}`;described.add(key);
  return `${body(b)} של ${name(i)} ב${p.sign}, בבית ${p.ownHouse.house}`;
 }
 function edge(item){const f=index.get(item.factId),a=order[0],b=order[1];return `${point(a,a===0?f.first:f.second)} ${aspectWords[f.type]}${point(b,b===0?f.first:f.second)}`;}
 function refsFor(item){const f=index.get(item.factId);return[f.id,...f.refs,...item.rulerIds];}
 function claim(text,refs,key,topic){const ids=[...new Set(refs)];if(ids.some(id=>!index.has(id)))throw Error('Missing evidence');addConcept(key,topic,ids);return{text,evidenceIds:ids,baseKeys:[...new Set(ids.flatMap(id=>index.get(id).baseKeys))],policyRefs:[plan.version,'relationship:'+model.relationship,'concept:'+key],kind:'symbolic',conceptKey:key};}
 for(const topic of ['communication','emotions']){
  const p=plan.plans[topic],focus=topic==='communication'?'Mercury':'Moon',house=topic==='communication'?3:4;
  const groups=new Map();for(const item of p.selected){if(!groups.has(item.counterBody))groups.set(item.counterBody,[]);groups.get(item.counterBody).push(item);}
  const paragraphs=[];
  function section(title,claims,semanticKind){const n=paragraphs.length+1;paragraphs.push({id:`${topic}:${n}`,title,ruleId:`phase-d.${topic}.${semanticKind}`,text:claims.map(c=>c.text).join('\n\n'),claims:claims.map((c,j)=>({...c,id:`${topic}:${n}:${j+1}`})),evidenceIds:[...new Set(claims.flatMap(c=>c.evidenceIds))],role:'symbolic',semanticKind});}
  const focal=order.map(i=>pos(i,focus)),over=order.map(i=>overlay(i,focus));
  const contextRefs=[...focal,...over].map(f=>f.id);
  const context=order.map(i=>{
   const x=pos(i,focus),o=overlay(i,focus);functionContexts.add(participants[i].id+':'+focus);
   return `${point(i,focus)} מציע ${signStyles[focus][x.signIndex]}, ובמפגש עם ${name(1-i)} הוא מגיע לבית ${o.house}, ולכן הסגנון הזה פוגש ${houseContexts[o.house]}`;
  }).join('. ') + '.';
  const roleFrame=family?(topic==='communication'?`בין ${name(parent)} כהורה ל${name(child)} כילד בקשר, ההבדל בין סגנונות אינו מדרג של בגרות; האחריות לאפשר שאלה ואי־הסכמה מוטלת במיוחד על ההורה.`:`גם כאשר ${name(child)} מזהה מצוקה אצל ${name(parent)}, אין בכך אחריות לנהל את מצב רוחו של ההורה. גיל ותלות אינם נגזרים מן המפה.`):friend?(topic==='communication'?'בחברות השיחה יכולה להישאר חקירה משותפת, בלי להפוך כל רעיון להסכם מחייב.':'מענה רגשי בין חברים אינו דורש זמינות בלתי מוגבלת או ויתור על פרטיות.'):siblings?'בקשר בין אחים, תפקיד משפחתי מוכר אינו קובע למי מותר לפרש את חוויית האחר.':model.relationship==='זוגיות'?'בשותפות זוגית חשוב לתת מקום לחוויה נפרדת גם כאשר ההחלטה משותפת.':'אין להסיק מן המפה תפקיד או מחויבות שלא נמסרו.';
  // Context opens only when no strong direct anchor exists; otherwise it follows the leading thread.
  const contextUnit=()=>section(topic==='communication'?`איך השיחה מגיעה לבית ${over[0].house} ולבית ${over[1].house}`:`שני מרחבים לביטחון: בית ${over[0].house} ובית ${over[1].house}`,[claim(context+' '+roleFrame,contextRefs,topic+':directional-context',topic)],'context');
  const ordered=[...groups].sort((a,b)=>Math.max(...b[1].map(x=>x.score))-Math.max(...a[1].map(x=>x.score))||a[0].localeCompare(b[0]));
  if(!p.selected.some(x=>x.central))contextUnit();
  for(let gi=0;gi<ordered.length;gi++){
   const [counter,items]=ordered[gi],meaning=themes[counter],groupRefs=items.flatMap(refsFor),claims=[];
   const main=items[0],owner=main.focusOwner,other=1-owner,x=pos(owner,main.focalBody),y=pos(other,counter);
   const descriptions=items.map(item=>{const f=index.get(item.factId);return `${edge(item)}${item.role==='central'?' — מגע מרכזי בקריאה':item.role==='balancing'?' — אפשרות מאזנת לצד המתח שכבר זוהה':item.role==='secondary'?' — הקשר משני בשל רוחב האורב':' — גורם מחזק בהקשר הפרק'}${f.type==='sextile'?', שהאפשרות בו זקוקה ליוזמה':''}.`;}).join(' ');
   const modes=[...new Set(items.map(x=>x.mode))];
   const symbolic=modes.map(mode=>`${body(main.focalBody)} ב${x.sign} פוגש כאן ${body(counter)} ב${y.sign}, כך ש${meaning[mode]}`).join('. ')+'.';
   // Signs and houses are used as functional context of the actual focal endpoint, not substituted for the other person.
   const style=signStyles[main.focalBody]?.[x.signIndex]??bodyFunctions[main.focalBody];
   const fk=participants[owner].id+':'+main.focalBody,ck=participants[other].id+':'+counter;
   const freshFocus=!functionContexts.has(fk),freshCounter=!functionContexts.has(ck);functionContexts.add(fk);functionContexts.add(ck);
   const direction=[freshFocus?`אצל ${name(owner)} נקודת המוצא היא ${style}, בתחום של ${houseContexts[x.ownHouse.house]}.`:'',freshCounter?`אצל ${name(other)} ${bodyFunctions[counter]} מקבל הקשר של ${houseContexts[y.ownHouse.house]}.`:''].filter(Boolean).join(' ');
   const signDistance=(y.signIndex-x.signIndex+12)%12,angle=Math.min(signDistance,12-signDistance)*30;
   const outOfSign=angle!==index.get(main.factId).angle?' ההיבט חוצה כאן את המבנה המזלי הטיפוסי שלו; הזווית המחושבת נשמרת, אך אין להחליף בה את הקשר המזלות.':'';
   const relationKey='relationship-thread:'+counter;
   const familyNotes={Sun:`במסגרת המשפחתית, הרצון של ${name(child)} אינו צריך לחקות את רצון ${name(parent)} כדי לזכות בהכרה.`,Moon:'במשפחה, הרגל שמרגיע את ההורה אינו נעשה משום כך הדרך הנכונה היחידה לילד.',Mercury:'בהקשר ההורי, הסבר של כוונה אינו מבטל את האופן שבו התקבלו הדברים אצל הילד, גם כשהילד בוגר.',Venus:'מחווה חמה במשפחה יכולה להישאר הזמנה, בלי להפוך להסכמה שהילד חייב לתת בתמורה.',Mars:'יוזמה הורית מועילה כשהיא מותאמת לצורך שנשאל; המפה אינה קובעת יכולת החלטה או תלות של הילד.',Jupiter:'הרחבת נקודת מבט במשפחה אינה צריכה להפוך מיד לשיעור; אפשר להכיר בקושי לפני שמציעים מה ללמוד ממנו.',Saturn:`גם אם שבתאי שייך ל${name(other)}, האחריות ההורית נשארת אצל ${name(parent)}; בעלות על הכוכב אינה סמכות משפחתית.`,Uranus:'שינוי בהסדר משפחתי דורש מסגרת מוסברת, ולא ציפייה שהילד יסתגל בלי לשאול.',Neptune:'רגישות משפחתית לאווירה אינה מצדיקה לדרוש מן הילד לאשר השערה על חווייתו.',Pluto:'זכותו של הילד לפרטיות אינה תלויה בכך שההורה השתכנע שאין דבר נוסף לברר.'};
   const friendNotes={Sun:'בחברות, הכרה בכיוון החיים של חבר אינה מחייבת לבחור באותו כיוון.',Moon:'אפשר לטפח חברות גם כשצורת ההרגעה המועדפת אינה זהה.',Mercury:'חברים יכולים לחלוק על הסבר לאירוע בלי לבטל את הזכות של האחר לתאר את חווייתו.',Venus:'בחברות, הערכה ומחווה נעימה אינן הבטחה לזמינות או להסכמה לכל בקשה.',Mars:'עזרה לחבר יכולה להתחיל בבקשת רשות לפעול, במיוחד כשהיוזמה משנה את הסידור שלו.',Jupiter:'הצעה מעודדת בחברות מועילה יותר כשהיא משאירה לחבר אפשרות לומר שכרגע נחוצה הכרה בקושי.',Saturn:'מחויבות בין חברים נשענת על הסכם שנבחר, ולא על תפקיד של מורה ובוחן.',Uranus:'בחברות אפשר לפתוח רעיון מפתיע ולציין במפורש שההסדר הקודם עדיין תקף עד להסכמה אחרת.',Neptune:'אפשר להציע לחבר השערה על מצב רוחו ולהשאיר מקום לתיקון, במקום להסתמך על הבנה ללא מילים.',Pluto:'חברות עמוקה אינה מחייבת מענה לכל שאלה; שמירת פרטיות יכולה להתקיים לצד אמון.'};
   let relationText='';if(!ledger.has(relationKey)&&(family||friend)){relationText=family?familyNotes[counter]:friendNotes[counter];addConcept(relationKey,topic,groupRefs);}
   claims.push(claim(descriptions+' '+symbolic+' '+direction+outOfSign+' '+relationText+(items.every(i=>i.role==='secondary')?' משקל הקריאה כאן משני; אין להציגו כדפוס מוביל או כתחליף למגע מדויק יותר.':''),groupRefs,topic+':thread:'+counter,topic));
   const linked=items.flatMap(i=>i.rulerIds).filter((v,i,a)=>a.indexOf(v)===i&&!describedRulers.has(v)).sort((a,b)=>participants[index.get(a).person].id.localeCompare(participants[index.get(b).person].id));
   linked.forEach(id=>{describedRulers.add(id);const r=index.get(id);rulerPlacements.add(participants[r.person].id+':'+r.ruler);});
   // Link rulership to the actual thread rather than emitting an isolated technical list.
   if(linked.length){
    const fragments=linked.map(id=>{const r=index.get(id);return `${topic==='communication'?'לדרך שבה מתנהל הבירור':'לתנאים שבהם מתבסס הביטחון'} אצל ${name(r.person)} יש כאן חוליה נוספת: ${body(r.ruler)} ב${pos(r.person,r.ruler).sign}, המופקד בשליטה המסורתית על בית ${house}, קושר את ${houseContexts[r.natalHouse]} במפת הלידה ל${houseContexts[r.partnerHouse]} במפגש עם ${name(1-r.person)}, ולכן המגע אינו רק תגובה רגעית אלא נוגע גם לאופן ארגון התחום הזה בקשר`;});
    const prior=claims.pop();const ids=[...prior.evidenceIds,...linked.flatMap(id=>[id,...index.get(id).refs])];ledger.delete(prior.conceptKey);claims.push(claim(prior.text+' '+fragments.join('. ')+'.',ids,prior.conceptKey,topic));
   }
   section(`${meaning.title} — ${name(owner)} מול ${name(other)}`,claims,'thread');
   if(gi===0&&p.selected.some(x=>x.central))contextUnit();
  }
  if(!ordered.length)section('גבול הכיסוי בפרק הזה',[claim('לא נמצאו מגעים כשירים לפי מדיניות הבחירה בפרק זה. מזלות וחפיפות מספקים הקשר בלבד, ואינם מצדיקים המצאת דפוס של תמיכה או חיכוך.',contextRefs,topic+':coverage',topic)],'coverage');
  const interaction=interactionSynthesis(p.selected,{name,body,pos,overlay,houseContexts});
  const central=p.selected.filter(x=>x.role==='central'),balancing=p.selected.filter(x=>x.role==='balancing'),reinforcing=p.selected.filter(x=>x.role==='reinforcing');
  const allRefs=[...contextRefs,...p.selected.flatMap(refsFor)];
  const leading=ordered[0],next=ordered[1];
  const nameThread=i=>`${body(i.focalBody)} של ${name(i.focusOwner)} מול ${body(i.counterBody)} של ${name(1-i.focusOwner)}`;
  let synthesis;
  if(leading){
   const first=leading[1][0],second=next?.[1][0];
   const leadMode=first.mode==='tension'?'חיכוך שדורש הבחנה בין צרכים':first.mode==='resource'?'ערוץ אפשרי לשיתוף פעולה':'מפגש צפוף בין תפקודים שאינם זהים';
   synthesis=`הציר המוביל כאן הוא ${nameThread(first)}: ${leadMode}. `;
   if(second)synthesis+=`לצדו, ${nameThread(second)} מוסיף ${second.mode==='resource'?'דרך אחרת לתת מענה':second.mode==='tension'?'שאלה נוספת שאינה נפתרת באותו אמצעי':'קרבה שדורשת להבחין גם בין הציפיות'}. `;
   if(second){
    const focalSame=first.focusOwner===second.focusOwner&&first.focalBody===second.focalBody;
    if(focalSame)synthesis+=`שני המגעים מתכנסים אל ${body(first.focalBody)} של ${name(first.focusOwner)}, כך שהמענה השונה אינו מתחלק בהכרח בין שני האנשים: אותו אדם עשוי לפגוש גם ${bodyFunctions[first.counterBody]} וגם ${bodyFunctions[second.counterBody]} מצד האחר. הבחנה זו מונעת מן הערוץ הנוח להפוך לציפייה שדרכו ייפתר גם הערוץ המורכב. `;
    else if(first.focusOwner!==second.focusOwner)synthesis+=`המוקד עובר בין האנשים: בראשון המוקד הוא ${body(first.focalBody)} של ${name(first.focusOwner)}, ובשני ${body(second.focalBody)} של ${name(second.focusOwner)}. מי שמציע תגובה בכיוון אחד יכול להזדקק למענה אחר בכיוון ההפוך; אין כאן חלוקה קבועה למי שתומך ולמי שמקבל תמיכה. `;
    else synthesis+=`אצל ${name(first.focusOwner)} משתתפים כאן תפקודים שונים, ${body(first.focalBody)} ו${body(second.focalBody)}. החיבור ביניהם הוא דרך הקשר החיים המחושב, ולא הנחה שמחשבה ורגש הם צורך זהה. `;
   }
   if(balancing.length)synthesis+=`הערוצים המאזנים פונים ל${[...new Set(balancing.map(x=>name(x.focusOwner)))].join(' ול')}; הם מציעים מענה מסוג אחר, ואינם מוחקים את החיכוך או מוכיחים ששני האנשים נעזרים בהם באותה מידה. `;
   if(reinforcing.length)synthesis+=`${reinforcing.length>1?'הממצאים המחזקים מרחיבים':'הממצא המחזק מרחיב'} את ההקשר, אך ${reinforcing.length>1?'אינם מקבלים':'אינו מקבל'} אוטומטית את משקל המוקד המדויק יותר. `;
   const domains=over.map(o=>houseContexts[o.house]);
   synthesis+=topic==='communication'?`אפשר לבחון את החיבור דווקא במעבר בין ${domains[0]} אצל ${name(order[1])} לבין ${domains[1]} אצל ${name(order[0])}: מה נדרש כדי שהרעיון יישאר מובן כאשר הוא עובר מן התחום של אחד אל התחום של האחר?`:`שאלת הביטחון המשותפת עוברת בין ${domains[0]} אצל ${name(order[1])} לבין ${domains[1]} אצל ${name(order[0])}. ההזמנה הסמלית היא לברר איזה מענה נחוץ בכל כיוון, ולא להניח שהקלה אצל אדם אחד מעידה שגם האחר נענה.`;
  }else synthesis='הסינתזה נשארת מוגבלת להקשרי המיקום והמפגש. אין בסיס לייחס לשניים דפוס יחסים שלא נתמך בהיבטים כשירים.';
  if(interaction){
   synthesis=interaction.text;
   if(central.length===0)synthesis+=' מגעי הפרק רחבים ומשניים; החיבור המוצע הוא אפשרות לבירור ואינו דפוס מרכזי מאומת.';
   const extras=ordered.filter(([theme])=>!interaction.themes.includes(theme));

   for(const [theme,items] of extras){
    const valid=items.filter(x=>x.role!=='secondary');if(!valid.length)continue;const x=valid[0],n=name(x.focusOwner),o=name(1-x.focusOwner);
    const extensionsByRole={
     Sun:x.mode==='tension'?` המגע המאתגר עם השמש של ${o} מציב לצד הצורך של ${n} גם רצון בנראות ובהכרה: נדרשת הבחנה בין זכותו של אדם לבטא רצון לבין בקשה שהאחר יצמצם עבורו את חווייתו.`:x.mode==='blend'?` כשהשמש של ${o} מצטרפת בצמידות ל${body(x.focalBody)} של ${n}, הרצון והמענה נעשים קרובים מאוד; כדאי להשאיר מקום לרצון נפרד גם כאשר ההזדהות מהירה.`:` ההכרה ברצון שמייצגת השמש של ${o} יכולה לתת למענה של ${body(x.focalBody)} אצל ${n} כתובת אישית, בלי להפוך הכרה להיענות לכל בקשה.`,
     Moon:` המפגש עם הירח של ${o} מוסיף למשמעות של ${body(x.focalBody)} אצל ${n} גם שאלה של הרגלי ביטחון; תגובה מוכרת לאחד אינה בהכרח הדרך המרגיעה עבור האחר.`,
     Mercury:` המילים שמייצג מרקורי של ${o} מאפשרות לבדוק עם ${n} אם ההבנה שנוצרה מתאימה לחוויה, ולהשאיר מקום לתיקון במקום לסגור את משמעותה.`,
     Venus:` המחווה הנעימה שמייצגת ונוס של ${o} יכולה לפתוח ל${n} מקום במפגש, כל עוד הנעימות אינה מחליפה בירור של העדפה.`,
     Mars:x.focalBody==='Venus'?` המפגש בין ונוס של ${n} למאדים של ${o} מחבר העדפה ליוזמה; כשהוא נושא גם את ${topic==='emotions'?'ענייני הבית':'ענייני השיחה'} דרך השליט, כדאי לבדוק כיצד מחווה או פעולה מקבלות מקום בשגרה בלי שהעשייה תקבע לבדה מה רצוי.`:` לצד זאת, המפגש של ${body(x.focalBody)} של ${n} עם מאדים של ${o} מוסיף אפשרות לפעולה: ${x.mode==='tension'?'המתח מדגיש את הצורך לעצור ולברר לפני שהתגובה קובעת עובדה':'הערך המעשי נבחן בעיתוי ובהתאמה לצורך, ולא רק בנכונות להתגייס'}.`,
     Jupiter:` יופיטר של ${o} מציע ל${n} להרחיב את טווח האפשרויות; המענה נשאר מועיל כאשר אופק רחב אינו נעשה הבטחה או דרישה להתעודד.`,
     Saturn:` הנוכחות של שבתאי של ${o} בקשר עם ${body(x.focalBody)} של ${n} מדגישה עקביות, אך עקביות אינה סמכות לקבוע את חוויית האחר.`,
     Uranus:` אורנוס של ${o} מוסיף למענה של ${n} אפשרות לצאת מהרגל; השינוי יכול להישאר הצעה שנבחנת ולא ביטול בשתיקה של הסדר מוכר.`,
     Neptune:` הרגישות שמייצג נפטון של ${o} מרחיבה את הקשב לגוון של ${n}, בתנאי שהתרשמות נשארת השערה שאפשר לתקן.`,
     Pluto:` פלוטו של ${o} מעמיק את שאלת המשמעות במפגש עם ${n}; הרשות לעצור את הבירור היא תנאי לכך שהעומק יישאר הדדי.`
    };
    synthesis+=extensionsByRole[theme];
   }


  }
  if(family)synthesis+=topic==='communication'?` בהסכם משפחתי, ${name(parent)} כהורה יכול לברר עם ${name(child)} מה הובן ומה עדיין פתוח, בלי להפוך הסבר על כל רגש לתנאי לכיבוד הגבול.`:` כאשר ${name(parent)} ו${name(child)} חוזרים לשיחה טעונה, האחריות ההורית היא להשאיר מקום לתיקון ההבנה; הילד אינו צריך לאשר פירוש רק כדי להרגיע את ההורה.`;
  else if(friend)synthesis+=topic==='communication'?' בתכנון בין חברים, אפשר לסיים את השיחה בהבחנה בין רעיון שעורר עניין לבין צעד שכל אחד בחר להתחייב אליו.':' בחברות, אפשר להציע פעולה ולשאול אם היא רצויה כעת; החופש לסרב לעזרה אינו סירוב לקשר.';
  // Shared geometric channels are acknowledged once by reference; their interpretation is not repeated.
  if(p.shared.length)synthesis+=` ${p.shared.length===1?'מגע משותף נוסף נדון':'מגעים משותפים נוספים נדונים'} בפרק ${topics[p.shared[0].coveredIn]}; אין לספור את אותו מקור שוב כאישור נפרד.`;
  const finalClaims=[claim(synthesis,allRefs,topic+':integrated-synthesis',topic)];
  const remainingRulers=order.map(person=>model.facts.find(f=>f.kind==='ruler'&&f.person===person&&f.house===house)).filter(r=>!describedRulers.has(r.id));
  for(const r of remainingRulers){
   describedRulers.add(r.id);const rp=pos(r.person,r.ruler),ro=overlay(r.person,r.ruler);
   const seenRuler=rulerPlacements.has(participants[r.person].id+':'+r.ruler);rulerPlacements.add(participants[r.person].id+':'+r.ruler);
   const text=seenRuler?`${body(r.ruler)} של ${name(r.person)}, שמיקומו כבר נדון, נושא גם את ענייני בית ${house}. זהו קישור נוסף בין תחומי חיים דרך אותו גוף, ולא עוד היבט או אישור עצמאי.`:`אצל ${name(r.person)}, ${topic==='communication'?'אופן הבירור מקבל גם הקשר של':'תחושת השייכות נקראת גם דרך'} ${houseContexts[r.natalHouse]}: ${body(r.ruler)} ב${rp.sign}, השליט המסורתי של ${topic==='communication'?'תחום השיחה והלמידה':'תחום הבית'}, מגיע אצל ${name(1-r.person)} לבית ${r.partnerHouse} ול${houseContexts[r.partnerHouse]}${r.quality==='cusp-sign-sensitive'||ro.nearCusp?'; השיוך רגיש לגבול ואינו עוגן יחיד למסקנה':''}.`;
   finalClaims.push(claim(text,[r.id,...r.refs],topic+':remaining-ruler:'+participants[r.person].id,topic));
  }
  section(leading?`${themes[leading[0]].title}${next?' לצד '+themes[next[0]].title:''}`:'מה אפשר לבסס מן ההקשר',finalClaims,'synthesis');
  trace.push({topic,selected:p.selected.map(x=>({...x})),omitted:p.omitted,shared:p.shared,rulers:[...new Set(p.selected.flatMap(x=>x.rulerIds))],synthesisRule:interaction?.rule??'graph-weighted-directional-threads',narrativePlan:paragraphs.map(p=>p.semanticKind),groups:ordered.map(([theme,items])=>({theme,edges:items.map(i=>i.factId)}))});
  chapters.push({id:topic,title:topics[topic],paragraphs});
 }
 return{chapters,trace,semanticLedger:[...ledger].map(([key,v])=>({key,...v}))};
}
