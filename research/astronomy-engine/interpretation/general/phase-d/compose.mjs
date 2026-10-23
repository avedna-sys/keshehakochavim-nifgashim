import {aspectBinding,renderAspectReading} from './attribution.mjs';
import {interactionSynthesis} from './interactions.mjs';
import {pointInfo} from '../../../synastry.mjs';
import {signStyles,bodyFunctions} from '../lexicon.mjs';
import {houseContexts} from '../../content.mjs';
const topics={communication:'תקשורת',emotions:'רגשות'};
const themes={"Sun": {"title": "לתת מקום לקול אישי"}, "Moon": {"title": "להכיר בשני קצבי תגובה"}, "Mercury": {"title": "כשהמילים פוגשות את החוויה"}, "Venus": {"title": "מחווה נעימה והעדפה אישית"}, "Mars": {"title": "המעבר מתגובה לפעולה"}, "Jupiter": {"title": "מרחב רחב שאינו מדלג על הפרטים"}, "Saturn": {"title": "רצינות בלי בחינה של האדם"}, "Uranus": {"title": "מרחב לשינוי עם רצף ברור"}, "Neptune": {"title": "רגישות שמשאירה מקום לבדיקה"}, "Pluto": {"title": "עומק עם רשות לעצור"}};
export function composeSynthesis(model,participants,plan){
 const index=new Map(model.facts.map(f=>[f.id,f])),pid=i=>i?'B':'A',pos=(i,b)=>index.get(`pos:${pid(i)}:${b}`),overlay=(i,b)=>index.get(`overlay:${pid(i)}:${b}:in:${pid(1-i)}`),name=i=>model.names[i],body=b=>pointInfo[b][0];
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));
 const family=model.relationship==='הורה וילד',friend=model.relationship==='חברות',siblings=model.relationship==='אחים',parent=family?participants.findIndex(p=>p.role==='parent'):null,child=family?1-parent:null;
 const chapters=[],trace=[],ledger=new Map(),rulerContexts=new Set();
 function claim(text,refs,key,topic,extra={}){
  if(ledger.has(key))throw Error('Repeated concept: '+key);
  const ids=[...new Set(refs)];if(!ids.length||ids.some(id=>!index.has(id)))throw Error('Missing evidence');
  ledger.set(key,{chapter:topic,evidenceIds:ids});return{text,evidenceIds:ids,baseKeys:[...new Set(ids.flatMap(id=>index.get(id).baseKeys))],policyRefs:[plan.version,'relationship:'+model.relationship,'concept:'+key],kind:'symbolic',conceptKey:key,...extra};
 }
 const frameRefs=b=>[b.factId,b.focal.positionId,b.counter.positionId,b.focal.overlayId,b.counter.overlayId];
 for(const topic of ['communication','emotions']){
  const p=plan.plans[topic],focus=topic==='communication'?'Mercury':'Moon',house=topic==='communication'?3:4;
  const central=p.selected.filter(x=>x.role==='central'),eligible=p.selected.filter(x=>x.role!=='secondary');
  const interaction=interactionSynthesis(eligible.length?eligible:p.selected,{name,body,pos,overlay,houseContexts});
  const paragraphs=[];
  function section(title,claims,semanticKind){if(!claims.length)return;const n=paragraphs.length+1;paragraphs.push({id:`${topic}:${n}`,title,ruleId:`phase-d-corrected.${topic}.${semanticKind}`,text:claims.map(c=>c.text).join('\n\n'),claims:claims.map((c,j)=>({...c,id:`${topic}:${n}:${j+1}`})),evidenceIds:[...new Set(claims.flatMap(c=>c.evidenceIds))],role:'symbolic',semanticKind});}
  const contextRefs=order.flatMap(i=>[pos(i,focus).id,overlay(i,focus).id]);
  const context=order.map(i=>{const x=pos(i,focus),o=overlay(i,focus);return `${body(focus)} של ${name(i)} ב${x.sign}, בבית ${x.ownHouse.house}, מתאר ${signStyles[focus][x.signIndex]}. החפיפה לבית ${o.house} של ${name(1-i)} מציבה את ה${topic==='emotions'?'מענה הרגשי':'שיחה'} במרחב של ${houseContexts[o.house]}`;}).join('. ')+'.';
  section(topic==='emotions'?'שתי דרכים לחוות ביטחון':'שתי דרכי מחשבה בתוך המפגש',[claim(context,contextRefs,topic+':context',topic)],'context');
  function aspectClaim(item,depth){
   const b=aspectBinding(model,item),detailed=depth==='central',rendered=renderAspectReading(model,b,detailed);
   return claim(rendered.text,frameRefs(b),topic+':aspect:'+item.key,topic,{kindOfClaim:'aspect-reading',aspectBindings:[b],readingMode:b.mode,detailed,anchorText:rendered.anchorText,interpretationText:rendered.interpretationText,weight:item.role});
  }

  for(const item of central)section(`${themes[item.counterBody].title} — ${name(item.focusOwner)} ו${name(1-item.focusOwner)}`,[aspectClaim(item,'central')],'central');
  // Supporting evidence has a single compact section; no stand-alone treatment for secondary contacts.
  const additions=eligible.filter(x=>!x.central),supportClaims=[],seenFacets=new Set();
  const facets=central.map(x=>[participants[x.focusOwner].id,x.counterBody,x.mode].join(':'));facets.forEach(k=>seenFacets.add(k));
  const summarized=[];
  for(const item of additions){
   const facet=[participants[item.focusOwner].id,item.counterBody,item.mode].join(':');
   if(seenFacets.has(facet)){summarized.push(item.factId);continue;}seenFacets.add(facet);
   supportClaims.push(aspectClaim(item,'compact'));
  }
  section('הבחנות נוספות שמשנות את התמונה',supportClaims,'support');
  // Rulers supply the bridge to a life domain; they are not another independent aspect confirmation.
  const rulerClaims=[];
  for(const i of order){
   const r=model.facts.find(f=>f.kind==='ruler'&&f.person===i&&f.house===house),x=pos(i,r.ruler),o=overlay(i,r.ruler),key=participants[i].id+':'+r.ruler;
   const already=rulerContexts.has(key);rulerContexts.add(key);
   const text=already?`${body(r.ruler)} של ${name(i)} נושא גם את ענייני בית ${house}; מיקומו שכבר נדון מחבר כאן תחום נוסף לאותה שרשרת, ואינו אישור עצמאי.`:`ה${topic==='emotions'?'ביטחון':'בירור'} של ${name(i)} קשור גם ל${houseContexts[r.natalHouse]}: ${body(r.ruler)} ב${x.sign}, השליט המסורתי של בית ${house}, מעביר את הדגש במפגש עם ${name(1-i)} ל${houseContexts[r.partnerHouse]}${r.quality==='cusp-sign-sensitive'||o.nearCusp?'; השיוך סמוך לגבול ולכן אינו עוגן יחיד למסקנה':''}.`;
   rulerClaims.push(claim(text,[r.id,...r.refs],topic+':ruler:'+participants[i].id,topic));
  }
  section(topic==='emotions'?'מה נותן לביטחון הקשר בחיים':'מה עומד מאחורי אופן הבירור',rulerClaims,'rulers');
  const usedIds=new Set(),usedItems=[];
  if(interaction)for(const id of interaction.aspectIds)usedItems.push(p.selected.find(x=>x.factId===id));
  let synthesis=interaction?.text;
  if(!synthesis){
   if(central.length){const x=central[0],b=aspectBinding(model,x);synthesis=`השאלה המשותפת אינה כיצד להגיע לתגובה זהה, אלא כיצד המפגש בין ${bodyFunctions[b.focal.body]} של ${name(b.focal.person)} לבין ${bodyFunctions[b.counter.body]} של ${name(b.counter.person)} מקבל מקום בלי להפוך צורך של אחד לתקן מחייב עבור האחר. ההקשר של ${houseContexts[b.focal.partnerHouse]} אצל ${name(b.counter.person)} מראה היכן כדאי לברר זאת בקשר.`;usedItems.push(x);}
   else synthesis='אין בפרק עוגן מרכזי לפי מדיניות המשקל. הקשרי המיקום מאפשרים שאלות לבירור, אך אינם מצדיקים הכרזה על דפוס חזק של תמיכה או חיכוך.';
  }
  if(!central.length&&interaction)synthesis+=' המגעים שעליהם נשען החיבור רחבים ומשניים; זו אפשרות לבירור, ולא הכרזה על דפוס מרכזי.';
  const relational=family?(topic==='emotions'?` בקשר בין ${name(parent)} כהורה לבין ${name(child)} כילד בקשר, זכות לתקן את ההבנה אינה מותנית בהרגעת ההורה; האחריות ההורית היא להשאיר את הבירור פתוח גם כאשר נוח יותר להגיע להסבר סופי.`:` ${name(parent)} כהורה יכול לברר מה הובן בהסכם בלי להפוך חשיפה של כל מניע לתנאי לכיבוד הגבול של ${name(child)}.`):friend?(topic==='emotions'?' בחברות, אפשר להבחין בין נוכחות מיטיבה לבין התערבות: לשאול איזו עזרה רצויה, ולהשאיר אפשרות לבחור זמן או דרך אחרת.':' בין חברים, ההתלהבות מרעיון והבחירה להתחייב לו יכולות להישאר שתי החלטות שונות.'):siblings?' בקשר בין אחים, ההיסטוריה המשותפת אינה מעניקה לאחד סמכות להגדיר את חוויית האחר.':'';
  synthesis+=relational;
  const uniqueUsed=[...new Map(usedItems.map(x=>[x.factId,x])).values()],bindings=uniqueUsed.map(x=>aspectBinding(model,x));
  const refs=[...contextRefs,...bindings.flatMap(frameRefs)];
  const synthesisClaim=claim(synthesis,refs,topic+':synthesis',topic,{kindOfClaim:bindings.length?'combined-synthesis':'limited-synthesis',aspectBindings:bindings,synthesisAspectIds:bindings.map(b=>b.factId),interactionRule:interaction?.rule??'limited-directional-combination'});
  section('המשמעות של השילוב',[synthesisClaim],'synthesis');
  const secondary=p.selected.filter(x=>x.role==='secondary');
  // Keep all selected findings and sources accessible without giving weak findings their own paragraphs.
  const catalogRefs=[...new Set([...secondary.flatMap(x=>frameRefs(aspectBinding(model,x))),...summarized])];
  if(catalogRefs.length){const id=paragraphs.at(-1);id.evidenceIds=[...new Set([...id.evidenceIds,...catalogRefs])];id.sourceOnlyEvidenceIds=catalogRefs;}
  trace.push({topic,selected:p.selected.map(x=>({...x})),omitted:p.omitted,shared:p.shared,rulers:order.map(i=>`ruler:${pid(i)}:${house}`),synthesisRule:interaction?.rule??'limited-directional-combination',narrativePlan:paragraphs.map(p=>p.semanticKind),groups:[],presentation:{central:central.map(x=>x.factId),support:supportClaims.map(c=>c.aspectBindings[0].factId),sourceOnly:[...secondary.map(x=>x.factId),...summarized]}});
  chapters.push({id:topic,title:topics[topic],paragraphs});
 }
 return{chapters,trace,semanticLedger:[...ledger].map(([key,v])=>({key,...v}))};
}
