import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {cases} from '../interpretation/general/phase-e/fixtures.mjs';
import {createPhaseEInterpretation,validateReport} from '../interpretation/general/phase-e/generate.mjs';
import {renderRecipe} from '../interpretation/general/phase-e/render.mjs';
import {familyKey} from '../interpretation/general/phase-e/policy.mjs';
import {buildFindings} from '../interpretation/facts.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
function input(s,reverse=false){const people=s.people.map((p,i)=>({...p,name:s.names[i]})),ps=people.map((_,i)=>({id:i?'second':'first',...(s.roles?{role:s.roles[i]}:{})}));return{pair:{...calculateExperimentalSynastry(...(reverse?people.reverse():people),resolver),relationship:s.relationship},participants:reverse?ps.reverse():ps};}
const run=s=>{const x=input(s);return createPhaseEInterpretation(x.pair,{participants:x.participants});};
const texts=r=>r.report.chapters.map(c=>[c.title,...c.paragraphs.map(p=>[p.title,p.text])]);
test('five fresh calculated maps: exact findings, three chapters only, every statement rerenders from exact sources',()=>{
 for(const s of cases){const x=input(s),before=JSON.stringify(x.pair),r=createPhaseEInterpretation(x.pair,{participants:x.participants});assert.equal(JSON.stringify(x.pair),before);assert.deepEqual(r.facts,buildFindings(x.pair));assert.deepEqual(r.report.chapters.map(c=>c.id),['love','attraction','intimacy']);assert.equal(r.report.scope.phaseF,false);assert.equal(validateReport(r.facts,x.participants,r.report).status,'passed');}
});
test('ownership and entire prose are invariant under reversing people in all five scenarios',()=>{
 for(const s of cases){const a=run(s),x=input(s,true),b=createPhaseEInterpretation(x.pair,{participants:x.participants});assert.deepEqual(texts(a),texts(b));const keys=r=>r.report.selectionTrace.map(t=>t.selected.map(x=>x.key));assert.deepEqual(keys(a),keys(b));}
});
test('one narrative owner per geometric edge; central/secondary roles and traditional houses are preserved',()=>{
 const counts=[];for(const s of cases){const r=run(s),owned=[];for(const t of r.report.selectionTrace){counts.push(t.selected.length);const c=r.report.chapters.find(c=>c.id===t.topic);for(const x of t.selected){owned.push(x.factId);const f=r.facts.facts.find(f=>f.id===x.factId);assert.equal(x.orb,f.orb);assert.equal(x.limit,f.limit);assert.ok(!f.nearBoundary);if(x.role==='secondary')assert.ok(t.presentation.sourceOnly.some(y=>y.factId===x.factId));}
  if(s.relationship==='זוגיות'){assert.ok(!c.paragraphs.some(p=>p.semanticKind==='rulers'));continue;}
  const ruler=c.paragraphs.find(p=>p.semanticKind==='rulers').claims[0];assert.equal(ruler.recipe.rulerIds.length,2);for(const id of ruler.recipe.rulerIds)assert.equal(r.facts.facts.find(f=>f.id===id).house,{love:7,attraction:5,intimacy:8}[t.topic]);}
 assert.equal(new Set(owned).size,owned.length);const concepts=r.report.semanticLedger.map(c=>c.conceptKey);assert.equal(new Set(concepts).size,concepts.length);}
 assert.ok(new Set(counts).size>2);
});
test('missing Venus–Mars is measured from actual computed aspects and cannot be narrated as present',()=>{
 for(const s of [cases[1],cases[2]]){const r=run(s),t=r.report.selectionTrace.find(t=>t.topic==='attraction');assert.ok(t.missing.includes('Mars|Venus'));assert.ok(!r.facts.facts.some(f=>f.kind==='aspect'&&familyKey(f.first,f.second)==='Mars|Venus'));assert.ok(!t.selected.some(x=>x.theme==='wanting-and-acting'));const c=r.report.chapters.find(c=>c.id==='attraction');assert.ok(!c.paragraphs.flatMap(p=>p.claims.flatMap(c=>c.aspectBindings)).some(b=>familyKey(b.focal.body,b.counter.body)==='Mars|Venus'));}
});
test('weak existing contact is not falsely declared absent when it is left in sources',()=>{
 const r=run(cases[0]),t=r.report.selectionTrace.find(t=>t.topic==='attraction');assert.ok(t.selected.some(x=>x.theme==='tempo'&&x.role==='secondary'));assert.ok(!t.missing.includes('Mars|Mars'));const text=r.report.chapters.find(c=>c.id==='attraction').paragraphs.map(p=>p.text).join(' ');assert.ok(!text.includes('אין מגע מאדים–מאדים'));
});
test('non-couple scopes are safe across all fixture maps, family roles required, no gender or age inferred',()=>{
 for(const base of cases.slice(0,3))for(const relationship of ['חברות','אחים','הורה וילד','אחר']){const s={...base,relationship,roles:relationship==='הורה וילד'?['child','parent']:undefined},r=run(s);assert.equal(r.report.scope.romantic,false);assert.equal(r.report.chapters[2].title,'אמון וגבולות');const text=JSON.stringify(texts(r));for(const word of ['תשוקה','מינית','רומנט','משיכה','אינטימיות','ארוט'])assert.ok(!text.includes(word));}
 const x=input(cases[4]);assert.throws(()=>createPhaseEInterpretation(x.pair,{participants:[{id:'first'},{id:'second'}]}));
});
test('negative controls reject changed people, signs, houses, aspect modes, weights, text and invented absences',()=>{
 const s=cases[0],r=run(s),x=input(s),claims=report=>report.chapters.flatMap(c=>c.paragraphs.flatMap(p=>p.claims));
 const mutate=[c=>c.aspectBindings[0].focal.sign='דגים',c=>c.aspectBindings[0].counter.natalHouse=1,c=>c.aspectBindings[0].counter.partnerHouse=2,c=>c.recipe.item.focusOwner=1-c.recipe.item.focusOwner,c=>c.recipe.item.mode='resource',c=>c.recipe.item.role='secondary',c=>c.text=c.text+' משפט זר'];
 for(const f of mutate){const report=structuredClone(r.report),c=claims(report).find(c=>c.recipe.kind==='aspect'&&c.recipe.item.mode==='tension');f(c);for(const ch of report.chapters)for(const p of ch.paragraphs)p.text=p.claims.map(c=>c.text).join('\n\n');assert.throws(()=>validateReport(r.facts,x.participants,report));}
 const display=structuredClone(r.report);display.chapters[0].paragraphs[0].text+=' משפט שאינו במקורות';assert.throws(()=>validateReport(r.facts,x.participants,display));
 const report=structuredClone(r.report),c=claims(report).find(c=>c.recipe.kind==='synthesis'&&c.recipe.topic==='attraction');c.recipe.missing.push('Mars|Venus');assert.throws(()=>validateReport(r.facts,x.participants,report));
});
test('renaming people cannot select a different mechanism; malformed astro snapshot rejected',()=>{
 const s=cases[0],x=input(s),r=createPhaseEInterpretation(x.pair,{participants:x.participants});x.pair.charts.forEach(c=>c.name='שם זהה');const renamed=createPhaseEInterpretation(x.pair,{participants:x.participants});const key=r=>r.report.selectionTrace.map(t=>t.selected.map(x=>x.key));assert.deepEqual(key(renamed),key(r));x.pair.aspects[0].orb+=1;assert.throws(()=>createPhaseEInterpretation(x.pair,{participants:x.participants}));
});
test('actual calculated map with no attraction evidence stays limited without backfilling a story',()=>{
 const s={...cases[2],people:[cases[2].people[0],{...cases[2].people[1],date:'1979-02-15'}]},r=run(s),t=r.report.selectionTrace.find(t=>t.topic==='attraction'),c=r.report.chapters.find(c=>c.id==='attraction');
 assert.equal(t.selected.length,0);assert.ok(c.paragraphs.some(p=>p.semanticKind==='coverage'));assert.ok(c.paragraphs.flatMap(p=>p.claims).every(c=>c.aspectBindings.length===0));assert.ok(c.paragraphs.at(-1).text.includes('אין בסיס לשלב היבטים שלא נמצאו'));
});
test('optional mean points cannot enter Phase E; approval of earlier chapters is not altered',()=>{
 const s=cases[0],people=s.people.map((p,i)=>({...p,name:s.names[i]})),participants=[{id:'first'},{id:'second'}];
 const pair={...calculateExperimentalSynastry(...people,resolver,{includeMeanNodes:true,includeMeanLilith:true}),relationship:s.relationship};
 const r=createPhaseEInterpretation(pair,{participants});assert.deepEqual(texts(r),texts(run(s)));for(const t of r.report.selectionTrace)for(const x of t.selected)assert.ok(!/Node|Lilith/.test(x.factId));
});
test('computed context and ruler chains cannot be left without their exact sources',()=>{
 const s=cases[0],r=run(s),x=input(s);
 for(const kind of ['context','aspect']){const report=structuredClone(r.report),c=report.chapters.flatMap(c=>c.paragraphs.flatMap(p=>p.claims)).find(c=>c.recipe.kind===kind);c.evidenceIds.pop();assert.throws(()=>validateReport(r.facts,x.participants,report));}
});
test('approved Phase D prose is unchanged after generating the new chapters',async()=>{
 const {createSynthesisInterpretation}=await import('../interpretation/general/phase-d/generate.mjs');
 for(const s of cases){const x=input(s),before=createSynthesisInterpretation(x.pair,{participants:x.participants});createPhaseEInterpretation(x.pair,{participants:x.participants});assert.deepEqual(createSynthesisInterpretation(x.pair,{participants:x.participants}),before);}
});
test('three couple reports differ in synthesis mechanisms and prose after names/numbers are removed',()=>{
 const reports=cases.slice(0,3).map(run),normalize=(r,text)=>{for(const name of r.report.names)text=text.split(name).join('אדם');return text.replace(/\d+(?:\.\d+)?/g,'מספר');};
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(let topic=0;topic<3;topic++){
  const a=reports[i].report.chapters[topic].paragraphs.at(-1).text,b=reports[j].report.chapters[topic].paragraphs.at(-1).text;assert.notEqual(normalize(reports[i],a),normalize(reports[j],b));
 }
});
test('opposite Venus–Mars directions keep their own signs/houses and supporting contact cannot become a deep anchor',()=>{
 const r=run(cases[0]),c=r.report.chapters.find(c=>c.id==='attraction'),readings=c.paragraphs.flatMap(p=>p.claims).filter(c=>c.recipe.kind==='aspect');assert.equal(readings.length,2);
 const [a,b]=readings.map(c=>c.aspectBindings[0]);assert.equal(a.focal.sign,'טלה');assert.equal(a.focal.natalHouse,10);assert.equal(a.counter.sign,'סרטן');assert.equal(b.focal.sign,'עקרב');assert.equal(b.counter.sign,'דגים');
 const report=structuredClone(r.report),support=report.chapters.find(c=>c.id==='attraction').paragraphs.flatMap(p=>p.claims).find(c=>c.recipe.kind==='aspect'&&!c.recipe.detailed);support.recipe.detailed=true;support.text=renderRecipe(r.facts,input(cases[0]).participants,support.recipe);for(const ch of report.chapters)for(const p of ch.paragraphs)p.text=p.claims.map(c=>c.text).join('\n\n');assert.throws(()=>validateReport(r.facts,input(cases[0]).participants,report));
});

// Regression: use two genuinely computed geometries, never flip a recipe mode to fake a chart.
test('supportive Moon–Pluto synthesis develops containment while square develops emotional intensity',()=>{
 const rich=run(cases[0]),sparse=run(cases[2]);
 const get=r=>r.report.chapters.find(c=>c.id==='intimacy').paragraphs.at(-1).claims[0];
 const a=get(rich),b=get(sparse),depth=c=>c.aspectBindings.find(x=>x.focal.body==='Moon'&&x.counter.body==='Pluto');
 assert.equal(depth(a).mode,'tension');assert.equal(depth(b).mode,'resource');
 assert.ok(a.text.includes('עלול להרגיש גם מציף'));assert.ok(b.text.includes('להעניק קשב והשקעה'));assert.ok(b.text.includes('אמון עשוי לצמוח'));
 assert.ok(!b.text.includes('עלול להרגיש גם מציף'));assert.notEqual(a.text,b.text);
});
test('all symbolic aspect modes have distinct meaningful clauses and are not undefined',async()=>{
 const {romanticPolarity}=await import('../interpretation/general/phase-e/romantic.mjs');
 for(const theme of ['recognition','receptivity','wanting-and-acting','emotional-depth','value-and-disclosure','agency-and-influence']){
  const clauses=['resource','tension','blend'].map(mode=>romanticPolarity(theme,mode));assert.equal(new Set(clauses).size,3);assert.ok(clauses.every(t=>typeof t==='string'&&t.length>40));
 }
});
test('actual endpoint ruler chains are integrated and removing or borrowing their evidence is rejected',()=>{
 const r=run(cases[0]),x=input(cases[0]),claims=r.report.chapters.flatMap(c=>c.paragraphs.flatMap(p=>p.claims));
 const a=claims.find(c=>c.recipe.kind==='aspect'&&c.recipe.topic==='attraction'&&c.recipe.item.mode==='tension');
 assert.ok(a.text.includes('מאדים של טל הוא גם השליט המסורתי של בית 7'));assert.ok(!a.text.includes('מאדים של אור נושא'));
 const b=claims.find(c=>c.recipe.kind==='aspect'&&c.recipe.topic==='attraction'&&c.recipe.item.mode==='resource');assert.ok(b.text.includes('מאדים של אור הוא גם השליט המסורתי של בית 5'));
 const damaged=structuredClone(r.report),claim=damaged.chapters.find(c=>c.id==='attraction').paragraphs.flatMap(p=>p.claims).find(c=>c.recipe.kind==='aspect'&&c.recipe.item.mode==='resource');
 claim.evidenceIds=claim.evidenceIds.filter(id=>id!=='ruler:A:5');assert.throws(()=>validateReport(r.facts,x.participants,damaged));
});
test('sparse coverage is a selector limit, wide Mars contact stays available, no absence of attraction claimed',()=>{
 const r=run(cases[2]),c=r.report.chapters.find(c=>c.id==='attraction'),text=c.paragraphs.at(-1).text;
 assert.ok(text.includes('זו מגבלת הכיסוי והתעדוף'));assert.ok(!text.includes('אין ערוץ אישי כשיר'));assert.ok(!text.includes('אין מגע מאדים–מאדים'));
 assert.ok(r.report.selectionTrace.find(t=>t.topic==='attraction').presentation.sourceOnly.length>0);
 for(const c of r.report.chapters)assert.ok(c.paragraphs.every(p=>!p.text.includes('undefined')));
});
test('couple prose removes repeated consent boilerplate and fixes contextual Hebrew',()=>{
 for(const s of cases.slice(0,3)){
  const r=run(s),text=r.report.chapters.flatMap(c=>c.paragraphs.map(p=>p.text)).join(' ');
  for(const old of ['מציע להציע','התגובה רגשית','זהו ערוץ דרך שליטה;','הסכמה ופרטיות הן תנאים אנושיים'])assert.ok(!text.includes(old));
  for(const c of r.report.chapters)assert.ok(!c.paragraphs.some(p=>p.semanticKind==='rulers'));
 }
});

test('review couples have no repeated long sentences after names and numbers are normalized',()=>{
 for(const sample of [cases[0],cases[2]]){
  const r=run(sample),seen=new Set();
  for(const c of r.report.chapters)for(const p of c.paragraphs)for(let sentence of p.text.split(/[.!?;\n]+/)){
   for(const name of r.report.names)sentence=sentence.split(name).join('אדם');
   sentence=sentence.replace(/\d+(?:\.\d+)?/g,'מספר').replace(/\s+/g,' ').trim();if(sentence.split(' ').length<12)continue;
   assert.ok(!seen.has(sentence),'Literal repeated sentence: '+sentence);seen.add(sentence);
  }
 }
});
