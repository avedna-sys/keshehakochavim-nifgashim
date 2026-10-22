import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {controlPeople} from '../interpretation/control-fixtures.mjs';
import {createGeneralInterpretation} from '../interpretation/general/generate.mjs';
import {renderEditorialReview} from '../interpretation/review-render.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
const people=i=>controlPeople[i].map((p,j)=>({...p,name:[['אור','טל'],['דנה','רון'],['יעל','איתן']][i][j]}));
const rels=['זוגיות','חברות','הורה וילד'];
const ids=i=>[{id:'first',...(i===2?{role:'child'}:{})},{id:'second',...(i===2?{role:'parent'}:{})}];
const pair=(i,options={})=>({...calculateExperimentalSynastry(...people(i),resolver,options),relationship:rels[i]});
const texts=r=>r.report.chapters.flatMap(c=>c.paragraphs.map(p=>p.text));
const keys=r=>r.report.selectionTrace.map(t=>({topic:t.topic,selected:t.selected.map(f=>f.key),rule:t.synthesisRule}));
test('three actual computed pairs: two chapters only, every claim traced, no input mutation, distinct selections',()=>{
 const selected=[];
 for(let i=0;i<3;i++){
  const p=pair(i),before=JSON.stringify(p),r=createGeneralInterpretation(p,{participants:ids(i)});assert.equal(JSON.stringify(p),before);
  assert.deepEqual(r.report.chapters.map(c=>c.id),['communication','emotions']);
  const index=new Map(r.facts.facts.map(f=>[f.id,f]));
  for(const c of r.report.chapters)for(const p of c.paragraphs){assert.equal(p.text,p.claims.map(c=>c.text).join('\n\n'));for(const claim of p.claims){assert.ok(claim.evidenceIds.length);for(const id of claim.evidenceIds)assert.ok(index.has(id));}}
  for(const trace of r.report.selectionTrace)for(const f of trace.selected){const actual=index.get(f.factId);assert.equal(f.orb,actual.orb);assert.equal(f.limit,actual.limit);}
  selected.push(keys(r));
 }
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.notDeepEqual(selected[i],selected[j]);
});
test('swapping all three participant pairs preserves full prose and stable semantic selections',()=>{
 for(let i=0;i<3;i++){
  const r=createGeneralInterpretation(pair(i),{participants:ids(i)});
  const reverse={...calculateExperimentalSynastry(...people(i).reverse(),resolver),relationship:rels[i]};
  const rr=createGeneralInterpretation(reverse,{participants:ids(i).reverse()});
  assert.deepEqual(texts(rr),texts(r));assert.deepEqual(keys(rr),keys(r));
 }
});
test('renaming people cannot select different astrology; optional mean points cannot enter chapter selection',()=>{
 const p=pair(0),r=createGeneralInterpretation(p,{participants:ids(0)});p.charts[0].name='שם אחר';p.charts[1].name='שם נוסף';
 assert.deepEqual(keys(createGeneralInterpretation(p,{participants:ids(0)})),keys(r));
 const extra=createGeneralInterpretation(pair(0,{includeMeanNodes:true,includeMeanLilith:true}),{participants:ids(0)});assert.deepEqual(texts(extra),texts(r));assert.deepEqual(keys(extra),keys(r));
});
test('family relation profiles block romantic/sexual prose and parenthood requires explicit roles',()=>{
 for(let i=0;i<3;i++)for(const relationship of ['אחים','הורה וילד']){
  if(relationship==='הורה וילד'&&i!==2)continue;const p=pair(i);p.relationship=relationship;const ps=[{id:'first',role:'child'},{id:'second',role:'parent'}];
  const r=createGeneralInterpretation(p,{participants:ps}),body=texts(r).join('\n');
  for(const term of ['משיכה מינית','תשוקה','רומנטי','מאהב','יחסי מין','מיניות'])assert.ok(!body.includes(term));
  if(relationship==='הורה וילד'){assert.ok(r.report.disclosure.includes('אינה סימטרית'));assert.throws(()=>createGeneralInterpretation(p,{participants:[{id:'first'},{id:'second'}]}));}
 }
});
test('invalid evidence and identities are rejected; review HTML escapes all participant text',()=>{
 const p=pair(0);p.aspects[0].orb+=1;assert.throws(()=>createGeneralInterpretation(p,{participants:ids(0)}));
 assert.throws(()=>createGeneralInterpretation(pair(0),{participants:[{id:'same'},{id:'same'}]}));
 const q=pair(0);q.charts[0].name='<img src=x onerror=bad>';const r=createGeneralInterpretation(q,{participants:ids(0)}),html=renderEditorialReview(r.facts,r.report);assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
});

test('revision preserves archived numeric facts and focus orbs while varying narrative plans',()=>{
 const headings=[],plans=new Set();
 for(let i=0;i<3;i++){
  const old=JSON.parse(readFileSync(new URL(`../interpretation/general/history/v0.1/case-${i+1}.json`,import.meta.url))),r=createGeneralInterpretation(pair(i),{participants:ids(i)});
  assert.deepEqual(r.facts,old.facts);
  const contacts=x=>x.report.selectionTrace.map(t=>t.selected.map(f=>[f.key,f.orb,f.limit]));assert.deepEqual(contacts(r),contacts(old));
  for(const c of r.report.chapters)for(const p of c.paragraphs)headings.push(p.title);
  for(const t of r.report.selectionTrace)plans.add(t.narrativePlan.join(','));
 }
 assert.equal(new Set(headings).size,headings.length);assert.ok(plans.size>1);
});
test('a newly combined calculated pair supports bounded fallback without fixture-specific assumptions',()=>{
 const p={...calculateExperimentalSynastry(controlPeople[0][0],controlPeople[1][1],resolver),relationship:'חברות'};
 const r=createGeneralInterpretation(p,{participants:[{id:'new-a'},{id:'new-b'}]});
 assert.equal(r.report.chapters.length,2);assert.ok(r.report.selectionTrace.some(t=>t.synthesisRule==='bounded-focus-reading'));
 const index=new Set(r.facts.facts.map(f=>f.id));for(const c of r.report.chapters)for(const p of c.paragraphs)for(const q of p.claims)for(const id of q.evidenceIds)assert.ok(index.has(id));
 assert.ok(!texts(r).join(' ').includes('משיכה מינית'));
});
