import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createSynthesisInterpretation} from '../interpretation/general/phase-d/generate.mjs';
import {aspectBinding,validateAttribution} from '../interpretation/general/phase-d/attribution.mjs';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {controlPeople} from '../interpretation/control-fixtures.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
function run(i){const input=i===3?JSON.parse(readFileSync(new URL('../interpretation/private/reference-input.json',import.meta.url))):{people:controlPeople[i].map((p,j)=>({...p,name:[['אור','טל'],['דנה','רון'],['יעל','איתן']][i][j]})),relationship:['זוגיות','חברות','הורה וילד'][i]};return createSynthesisInterpretation({...calculateExperimentalSynastry(...input.people,resolver),relationship:input.relationship},{participants:[{id:'first',...(i===2?{role:'child'}:{})},{id:'second',...(i===2?{role:'parent'}:{})}]});}
const readings=r=>r.report.chapters.flatMap(c=>c.paragraphs.flatMap(p=>p.claims)).filter(c=>c.kindOfClaim==='aspect-reading');
test('four fresh maps: every narrated aspect is single-bound, all exact contexts validate, numbers unchanged',()=>{
 for(let i=0;i<4;i++){if(i===3&&!existsSync(new URL('../interpretation/private/reference-input.json',import.meta.url)))continue;const r=run(i);assert.equal(validateAttribution(r.facts,r.report).status,'passed');for(const c of readings(r))assert.equal(c.aspectBindings.length,1);}
});
test('regression: Venus–Sun and Venus–Mars retain Venus Aries, never the first Moon Aquarius/Pisces',()=>{
 const r=run(0),cs=readings(r);
 for(const [counter,sign] of [['Sun','מאזניים'],['Mars','סרטן']]){
  const c=cs.find(c=>c.aspectBindings[0].focal.body==='Venus'&&c.aspectBindings[0].counter.body===counter);assert.ok(c);
  const b=c.aspectBindings[0];assert.equal(b.focal.sign,'טלה');assert.equal(b.focal.natalHouse,10);assert.equal(b.counter.sign,sign);assert.ok(c.text.startsWith('ונוס של אור בטלה'));
 }
});
test('regression: reversed Moon–Pluto and Moon–Neptune contexts are independently bound even when source-only',()=>{
 const r=run(0),item=r.report.selectionTrace.find(t=>t.topic==='emotions').selected.find(x=>x.factId==='aspect:A:Pluto:B:Moon:trine');assert.ok(item);
 const b=aspectBinding(r.facts,item);assert.equal(b.focal.person,1);assert.equal(b.focal.sign,'דגים');assert.equal(b.focal.natalHouse,12);assert.equal(b.counter.person,0);assert.equal(b.counter.sign,'עקרב');assert.equal(b.counter.natalHouse,5);
 const f=run(2),n=f.report.selectionTrace.find(t=>t.topic==='emotions').selected.find(x=>x.factId==='aspect:A:Moon:B:Neptune:opposition');assert.ok(n);const nb=aspectBinding(f.facts,n);assert.equal(nb.focal.sign,'תאומים');assert.equal(nb.counter.sign,'קשת');assert.equal(nb.focal.person,0);assert.equal(nb.counter.person,1);
});
test('negative controls: wrong sign, natal house, overlay house, owner, orb, mode and rendered context are rejected',()=>{
 const r=run(0);
 const mutations=[c=>c.aspectBindings[0].focal.sign='דגים',c=>c.aspectBindings[0].focal.natalHouse=1,c=>c.aspectBindings[0].counter.partnerHouse=2,c=>c.aspectBindings[0].focal.person=1,c=>c.aspectBindings[0].orb+=1,c=>c.readingMode='resource',c=>c.text=c.text.replace('ירח של אור בדלי','ירח של טל בדגים')];
 for(const mutate of mutations){const report=structuredClone(r.report),c=readings({report}).find(c=>c.text.startsWith('ירח של אור בדלי'));assert.ok(c);mutate(c);assert.throws(()=>validateAttribution(r.facts,report));}
});
test('combined synthesis rejects borrowed sign/house/person context rather than merely accepting existing source IDs',()=>{
 const r=run(2),report=structuredClone(r.report),s=report.chapters.find(c=>c.id==='emotions').paragraphs.flatMap(p=>p.claims).find(c=>c.kindOfClaim==='combined-synthesis');
 s.text=s.text.replace('הירח של יעל','הירח של איתן');assert.throws(()=>validateAttribution(r.facts,report));
});
test('secondary findings remain accessible in sources but cannot acquire standalone reading weight',()=>{
 for(let i=0;i<4;i++){if(i===3&&!existsSync(new URL('../interpretation/private/reference-input.json',import.meta.url)))continue;
  const r=run(i);for(const t of r.report.selectionTrace){const c=r.report.chapters.find(c=>c.id===t.topic),read=c.paragraphs.flatMap(p=>p.claims).filter(c=>c.kindOfClaim==='aspect-reading');
   const secondary=t.selected.filter(x=>x.role==='secondary');for(const x of secondary){assert.ok(!read.some(c=>c.aspectBindings[0].factId===x.factId));assert.ok(c.paragraphs.some(p=>p.sourceOnlyEvidenceIds?.includes(x.factId)));}
   assert.equal(c.paragraphs.filter(p=>p.semanticKind==='central').length,t.selected.filter(x=>x.role==='central').length);
  }
 }
});

test('negative control: changing a person inside the interpretation while preserving a valid anchor is rejected',()=>{
 const r=run(0),report=structuredClone(r.report),c=readings({report}).find(c=>c.detailed&&c.aspectBindings[0].counter.body==='Pluto');
 c.interpretationText=c.interpretationText.replace('עבור אור','עבור טל');c.text=c.anchorText+' — '+c.interpretationText;
 assert.throws(()=>validateAttribution(r.facts,report));
});
