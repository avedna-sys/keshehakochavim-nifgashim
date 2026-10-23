import {connectedRulerRefs} from './romantic.mjs';
import assert from 'node:assert/strict';
import {buildFindings} from '../../facts.mjs';
import {selectFindings,version} from './policy.mjs';
import {chapterTitle,mechanisms} from './language.mjs';
import {renderRecipe,frameFor,refsFor} from './render.mjs';
export function validateReport(model,participants,report){
 const plan=selectFindings(model,participants),index=new Map(model.facts.map(f=>[f.id,f])),keys=new Set(),rulerPositions=new Set();let bindings=0;
 assert.equal(report.scope.phaseF,false);assert.equal(report.scope.otherChapters,false);assert.equal(report.relationship,model.relationship);assert.deepEqual(report.names,model.names);assert.equal(report.scope.romantic,model.relationship==='זוגיות');assert.deepEqual(report.participants,participants);
 assert.deepEqual(report.chapters.map(c=>c.id),['love','attraction','intimacy']);
 for(const c of report.chapters){
  assert.equal(c.title,chapterTitle(c.id,model.relationship));
  for(const p of c.paragraphs){assert.equal(p.text,p.claims.map(c=>c.text).join('\n\n'),'Displayed paragraph differs from checked claims');for(const claim of p.claims){
   assert.ok(!keys.has(claim.conceptKey),'Duplicated concept');keys.add(claim.conceptKey);
   const r=claim.recipe;assert.equal(r.topic,c.id);assert.equal(claim.text,renderRecipe(model,participants,r),'Rendered attribution or symbolic clause mismatch');
   assert.ok(claim.evidenceIds.length);claim.evidenceIds.forEach(id=>assert.ok(index.has(id),'Unknown source'));
   const items=r.kind==='aspect'?[r.item]:r.kind==='synthesis'?r.items:[];
   if(r.kind==='synthesis')assert.deepEqual(r.missing,plan[c.id].missing,'Invented missing contact');
   assert.deepEqual(claim.aspectBindings,items.map(item=>frameFor(model,item)),'Borrowed endpoint context');
   if(model.relationship==='זוגיות')for(const id of connectedRulerRefs(model,items))assert.ok(claim.evidenceIds.includes(id),'Missing integrated ruler source');
   for(const item of items){assert.deepEqual(item,plan[c.id].selected.find(x=>x.factId===item.factId),'Selection or direction mismatch');for(const id of [...refsFor(frameFor(model,item)),...item.rulerIds])assert.ok(claim.evidenceIds.includes(id));bindings++;}
   if(r.kind==='context'){const focus={love:'Venus',attraction:'Mars',intimacy:'Moon'}[c.id];for(const i of [0,1])for(const id of [`pos:${i?'B':'A'}:${focus}`,`overlay:${i?'B':'A'}:${focus}:in:${i?'A':'B'}`])assert.ok(claim.evidenceIds.includes(id),'Missing contextual source');}
   if(r.kind==='rulers')for(const id of r.rulerIds)for(const ref of [id,...index.get(id).refs])assert.ok(claim.evidenceIds.includes(ref),'Missing ruler chain source');
   if(r.kind==='aspect'){assert.notEqual(r.item.role,'secondary','Secondary contact promoted into main narrative');assert.equal(r.detailed,r.item.central,'Narrative weight differs from selection');}
   if(r.kind==='rulers'){assert.equal(new Set(r.rulerIds).size,2);assert.deepEqual(r.rulerIds.map(id=>index.get(id).person).sort(),[0,1]);const expected=r.rulerIds.filter(id=>{const f=index.get(id);return rulerPositions.has(participants[f.person].id+':'+f.ruler);});assert.deepEqual(r.reusedIds,expected);for(const id of r.rulerIds){const f=index.get(id);rulerPositions.add(participants[f.person].id+':'+f.ruler);}assert.equal(r.rulerIds.length,2);for(const id of r.rulerIds){const f=index.get(id);assert.equal(f.kind,'ruler');assert.equal(f.house,{love:7,attraction:5,intimacy:8}[c.id]);}}
  }}
 }
 if(model.relationship!=='זוגיות'){
  const text=report.chapters.flatMap(c=>[c.title,...c.paragraphs.map(p=>p.text)]).join('\n');
  for(const term of ['תשוקה','משיכה','מינית','מיניות','גופנית','רומנט','אינטימיות','ארוט','מאהב'])assert.ok(!text.includes(term),'Relationship scope violation: '+term);
 }
 return{status:'passed',bindingUses:bindings,claims:keys.size};
}
export function createPhaseEInterpretation(pair,{participants}={}){
 if(!participants||participants.length!==2||participants.some(p=>!p||!/^[-_a-zA-Z0-9]{1,64}$/.test(p.id))||participants[0].id===participants[1].id)throw Error('Stable distinct participant IDs required');
 const model=buildFindings(pair);if(model.relationship==='הורה וילד'&&participants.map(p=>p.role).sort().join('|')!=='child|parent')throw Error('Explicit parent/child roles required');
 const plan=selectFindings(model,participants),index=new Map(model.facts.map(f=>[f.id,f])),order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id)),pid=i=>i?'B':'A';
 const chapters=[],trace=[],ledger=[],rulerPlacements=new Set();
 for(const [topic,p] of Object.entries(plan)){
  const paragraphs=[],central=p.selected.filter(x=>x.central),support=p.selected.filter(x=>!x.central&&x.role!=='secondary'),seen=new Set();
  function make(recipe,refs,key){const items=recipe.kind==='aspect'?[recipe.item]:recipe.kind==='synthesis'?recipe.items:[],ids=[...new Set([...refs,...(model.relationship==='זוגיות'?connectedRulerRefs(model,items):[])])];ledger.push({conceptKey:key,topic,evidenceIds:ids});return{text:renderRecipe(model,participants,recipe),recipe,evidenceIds:ids,aspectBindings:items.map(item=>frameFor(model,item)),baseKeys:[...new Set(ids.flatMap(id=>index.get(id).baseKeys))],policyRefs:[version,'relationship:'+model.relationship],kind:'symbolic',conceptKey:key};}
  function add(title,claims,kind){if(!claims.length)return;const n=paragraphs.length+1;paragraphs.push({id:`${topic}:${n}`,title,semanticKind:kind,text:claims.map(c=>c.text).join('\n\n'),claims:claims.map((c,j)=>({...c,id:`${topic}:${n}:${j+1}`})),evidenceIds:[...new Set(claims.flatMap(c=>c.evidenceIds))]});}
  const focus={love:'Venus',attraction:'Mars',intimacy:'Moon'}[topic],contextRefs=order.flatMap(i=>[`pos:${pid(i)}:${focus}`,`overlay:${pid(i)}:${focus}:in:${pid(1-i)}`]);
  add({love:'הדרך להראות העדפה ולקבל אותה',attraction:'שני סגנונות של יוזמה',intimacy:'היכן המענה הרגשי פוגש את האחר'}[topic],[make({kind:'context',topic},contextRefs,topic+':context')],'context');
  const active=[];
  for(const item of [...central,...support]){
   const key=[participants[item.focusOwner].id,item.theme,item.mode].join(':');
   if(seen.has(key))continue;seen.add(key);active.push(item);
  }
  const romanticTitles={'recognition':'הערכה, חיבה ותחושת רצויות','wanting-and-acting':'חיזור, יוזמה וקצב התגובה','emotional-depth':'פגיעות, הכלה ובניית אמון','value-and-disclosure':'חיבה שמבקשת עומק','agency-and-influence':'השקעה והתמדה בהתקרבות'};
  const facetTitle=item=>model.relationship==='זוגיות'?(romanticTitles[item.theme]??mechanisms[item.theme].title):model.relationship!=='זוגיות'&&item.theme==='wanting-and-acting'?'העדפה ויוזמה במפגש':mechanisms[item.theme].title;
  for(const item of active.filter(x=>x.central))add(facetTitle(item),[make({kind:'aspect',topic,item,detailed:true},[...refsFor(frameFor(model,item)),...item.rulerIds],topic+':central:'+item.key)],'central');
  const supplements=active.filter(x=>!x.central);
  add('גורמים נוספים: חיזוק, איזון או הבדל בכיוון',supplements.map(item=>make({kind:'aspect',topic,item,detailed:false},[...refsFor(frameFor(model,item)),...item.rulerIds],topic+':support:'+item.key)),'support');
  const rulerIds=order.map(i=>`ruler:${pid(i)}:${{love:7,attraction:5,intimacy:8}[topic]}`);
  const reusedIds=rulerIds.filter(id=>{const r=index.get(id),key=participants[r.person].id+':'+r.ruler;return rulerPlacements.has(key);});for(const id of rulerIds){const r=index.get(id);rulerPlacements.add(participants[r.person].id+':'+r.ruler);}
  if(model.relationship!=='זוגיות')add({love:'הבחירה במפגש וההקשר של שליט בית 7',attraction:'הביטוי האישי וההקשר של שליט בית 5',intimacy:'הגבול לשיתוף וההקשר של שליט בית 8'}[topic],[make({kind:'rulers',topic,rulerIds,reusedIds},rulerIds.flatMap(id=>[id,...index.get(id).refs]),topic+':rulers')],'rulers');
  if(!active.length)add('גבול הכיסוי של הפרק',[make({kind:'coverage',topic,noActive:true},contextRefs,topic+':coverage')],'coverage');
  add('המשמעות של השילוב',[make({kind:'synthesis',topic,items:active,missing:p.missing},[...contextRefs,...active.flatMap(x=>[...refsFor(frameFor(model,x)),...x.rulerIds])],topic+':synthesis')],'synthesis');
  const narrated=new Set(active.map(x=>x.factId)),sourceOnly=p.selected.filter(x=>!narrated.has(x.factId));
  const last=paragraphs.at(-1);last.sourceOnlyEvidenceIds=[...new Set(sourceOnly.flatMap(x=>refsFor(frameFor(model,x))))];const backgroundRulers=model.relationship==='זוגיות'?model.facts.filter(f=>f.kind==='ruler'&&[5,7,8].includes(f.house)).flatMap(f=>[f.id,...f.refs]):[];last.sourceOnlyEvidenceIds=[...new Set([...last.sourceOnlyEvidenceIds,...backgroundRulers.filter(id=>!last.evidenceIds.includes(id))])];last.evidenceIds=[...new Set([...last.evidenceIds,...last.sourceOnlyEvidenceIds])];
  trace.push({topic,...p,presentation:{central:active.filter(x=>x.central).map(x=>x.factId),compact:supplements.map(x=>x.factId),sourceOnly:sourceOnly.map(x=>({factId:x.factId,reason:x.role==='secondary'?'secondary':'covered-semantic-facet'}))}});
  chapters.push({id:topic,title:chapterTitle(topic,model.relationship),paragraphs});
 }
 const report={version,status:'phase-e-awaiting-professional-review',names:model.names,relationship:model.relationship,participants,chapters,selectionTrace:trace,semanticLedger:ledger,scope:{phaseE:true,phaseF:false,otherChapters:false,romantic:model.relationship==='זוגיות'},disclosure:'טיוטת שלב ה׳ לביקורת. הממצאים מחושבים במנוע הניסיוני הקיים; הפרשנות סמלית ואינה אבחנה, תחזית או מדד להתנהגות בפועל. חפיפות תלויות בדיוק שעת הלידה. הסכמה ופרטיות נדרשות בכל קשר ואינן נלמדות מן המפה.'};
 report.attributionAudit=validateReport(model,participants,report);return{facts:model,report};
}
