import {relationalAxes} from './relationship-summary.mjs';
import {selectInteraction,contextualRefs} from './editorial.mjs';
import assert from 'node:assert/strict';
import {createSynthesisInterpretation} from '../phase-d/generate.mjs';
import {createPhaseEInterpretation} from '../phase-e/generate.mjs';
import {aspectBinding} from '../phase-d/attribution.mjs';
import {version,seven,commitmentPlan,makeLedger,growthPlan,summaryPlan,itemRefs,closure,channel} from './plan.mjs';
import {render} from './render.mjs';
const titles={communication:'תקשורת',emotions:'רגשות',love:'אהבה',attraction:'משיכה',intimacy:'אינטימיות',commitment:'מחויבות ויציבות',growth:'אתגרים וצמיחה',summary:'סיכום היחסים'};
const socialTitles={love:'חיבה וקבלה',attraction:'יוזמה והנאה משותפת',intimacy:'אמון וגבולות'};
function prepare(pair,participants){
 const d=createSynthesisInterpretation(pair,{participants}),e=createPhaseEInterpretation(pair,{participants});assert.deepEqual(d.facts,e.facts);
 const traces=[...d.report.selectionTrace,...e.report.selectionTrace],model=d.facts,commitment=commitmentPlan(model,participants),six=[...traces,{topic:'commitment',selected:commitment.selected}];
 const initialLedger=makeLedger(model,participants,six),growth=growthPlan(initialLedger);
 const growthItems=[...growth.tensions,...growth.resources,...growth.blends];
 const all=[...six,{topic:'growth',selected:growthItems}],ledger=makeLedger(model,participants,all);
 const summary=summaryPlan(ledger,growth);
 const coverage=all.map(t=>({topic:t.topic,label:model.relationship==='זוגיות'?titles[t.topic]:(socialTitles[t.topic]??titles[t.topic]),active:t.selected.filter(i=>i.role!=='secondary').length,central:t.selected.filter(i=>i.central).length,uniqueIds:[...new Set(t.selected.map(i=>i.factId))]}));
 return {model,commitment,growth,ledger,summary,coverage,traces:all,interactions:selectInteraction(model,growthItems)};
}
function build(prepared,participants){
 const {model,commitment,growth,ledger,summary,coverage,traces,interactions}=prepared,contextIds=model.facts.filter(f=>f.kind==='position'&&['Saturn','Jupiter','Moon','Mercury'].includes(f.body)).map(f=>f.id);
 const chapters=[];
 function chapter(id){const c={id,title:titles[id],paragraphs:[]};chapters.push(c);return c;}
 function section(c,title,recipe,sourceOnly=[]){
  const items=recipe.kind==='commitment-aspect'?[recipe.item]:recipe.kind==='growth-channel'?[recipe.item,...(recipe.support?[recipe.support]:[])]:recipe.items;
  const evidenceIds=[...new Set([...(items.length?items.flatMap(i=>itemRefs(model,i)):closure(model,contextIds)),...(recipe.kind==='summary-prose'&&recipe.part==='needs'?contextualRefs(model):[])])];
  const bindings=items.map(i=>aspectBinding(model,i)),id=c.id+':'+(c.paragraphs.length+1);
  const claim={id:id+':1',kind:'symbolic',recipe,text:render(model,participants,recipe),evidenceIds,aspectBindings:bindings,policyRefs:[version,'relationship:'+model.relationship],conceptKey:id};
  c.paragraphs.push({id,title,semanticKind:recipe.kind,text:claim.text,claims:[claim],evidenceIds:[...new Set([...evidenceIds,...sourceOnly])],sourceOnlyEvidenceIds:sourceOnly.filter(id=>!evidenceIds.includes(id))});
 }
 const c=chapter('commitment');
 const sats=commitment.active.filter(i=>i.focalBody==='Saturn'),jups=commitment.active.filter(i=>i.focalBody==='Jupiter');
 section(c,'אחריות ואמינות במפגש',{kind:'commitment-block',part:'responsibility',intent:'reliability-not-compliance',items:sats},commitment.sourceOnly.flatMap(i=>itemRefs(model,i)));
 if(jups.length)section(c,'איך התמיכה מקבלת רצף',{kind:'commitment-block',part:'support',intent:'encouragement-and-scope',items:jups});
 if(commitment.active.length)section(c,'מה מבקשים לבנות יחד',{kind:'commitment-block',part:'integration',intent:'rulership-and-shared-expectation',items:commitment.active});
 const g=chapter('growth'),narrated=new Set();
 const headings={communication:'בהירות בלי להפוך שיחה למבחן',emotions:'להבין בלי להאיץ את החוויה',affection:'לתת למחווה את המשמעות המתאימה',action:'להיעזר בתיאום בלי לכפות דרך',direction:'להתפתח בלי לוותר על כיוון אישי'};
 for(const p of interactions){p.items.forEach(i=>narrated.add(i.factId));section(g,headings[p.concept]??'אפשרות להתפתחות',{kind:'growth-interaction',intent:'interaction:'+p.concept,items:p.items});}
 section(g,'איך ממשיכים את הבירור',{kind:'growth-end',intent:'relationship-responsibility',items:[]},[...growth.tensions,...growth.resources,...growth.blends,...growth.sourceOnly].filter(i=>!narrated.has(i.factId)).flatMap(i=>itemRefs(model,i)));
 const s=chapter('summary'),allRefs=ledger.flatMap(e=>itemRefs(model,e.representative));
 for(const part of ['character','needs','integration'])section(s,{character:'אופי המפגש',needs:'שתי חוויות בתוך הקשר',integration:'אפשרות להמשך ההתפתחות'}[part],{kind:'summary-prose',part,intent:'summary:'+part,relationalAxes:relationalAxes[model.relationship][part],items:summary.selected,coverage},part==='integration'?allRefs:[]);
 return {version,status:'phase-f-awaiting-professional-review',names:model.names,relationship:model.relationship,participants,chapters,selectionTrace:traces,coverage,ledger,summaryPlan:summary,scope:{phaseF:true,phaseG:false,uiIntegration:false,otherChaptersModified:false},disclosure:'מדגם מחקר סינתטי לביקורת בלבד. החישובים נשמרו במנוע הקיים; הפרשנות סמלית ואינה אבחון, תחזית או ציון התאמה. זמן הלידה משפיע על בתים ושליטים; לא נמסרה אי־ודאות מדודה. הסכמה ופרטיות אינן נלמדות מן המפה.',limitations:{axes:false,retrograde:false,natalPatternsNotSynthesized:true,traditionalRulersOnly:true,orbLimitsChanged:false,meaningScientificallyValidated:false}};
}
export function validatePhaseFReport(pair,participants,report){
 const prepared=prepare(pair,participants),expected=build(prepared,participants),idx=new Map(prepared.model.facts.map(f=>[f.id,f]));
 assert.deepEqual(report,expected,'Report, policy, provenance, mode, weights or prose changed');
 assert.deepEqual(report.coverage.map(c=>c.topic),seven);
 assert.equal(new Set(report.ledger.map(e=>e.factId)).size,report.ledger.length);
 assert.equal(new Set(report.ledger.map(e=>e.key)).size,report.ledger.length);
 for(const row of report.ledger){assert.equal(row.independentWeight,1);assert.equal(idx.get(row.factId).kind,'aspect');}
 let checked=0;
 for(const c of report.chapters)for(const p of c.paragraphs){
  assert.equal(p.text,p.claims.map(c=>c.text).join('\n\n'));
  for(const claim of p.claims){assert.equal(claim.text,render(prepared.model,participants,claim.recipe));
   for(const b of claim.aspectBindings){assert.deepEqual(b,aspectBinding(prepared.model,{factId:b.factId,focusOwner:b.focal.person,focalBody:b.focal.body,counterBody:b.counter.body}));assert.ok(claim.evidenceIds.includes(b.factId));checked++;}
   claim.evidenceIds.forEach(id=>assert.ok(idx.has(id)));}
 }
 if(report.relationship!=='זוגיות'){
  const text=report.chapters.map(c=>c.paragraphs.map(p=>p.text).join(' ')).join(' ');
  for(const term of ['רומנט','תשוקה','מינית','מיניות','משיכה','ארוט','חיזור','גופנית','זוגיות','זוגי'])assert.ok(!text.includes(term),'Unsafe relationship content: '+term);
 }
 return {status:'passed',bindingUsesChecked:checked,uniqueGeometricAspects:report.ledger.length,scopeChapters:7,duplicationPolicy:'one ledger row per actual edge; reuse is a reference, never another independent vote'};
}
export function createPhaseFInterpretation(pair,{participants}={}){
 const prepared=prepare(pair,participants),report=build(prepared,participants),audit=validatePhaseFReport(pair,participants,report);
 return {facts:prepared.model,report,audit};
}
