import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {controlPeople} from '../interpretation/control-fixtures.mjs';
import {createGeneralInterpretation} from '../interpretation/general/generate.mjs';
import {createSynthesisInterpretation} from '../interpretation/general/phase-d/generate.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
const roles=i=>[{id:'first',...(i===2?{role:'child'}:{})},{id:'second',...(i===2?{role:'parent'}:{})}];
const rel=['זוגיות','חברות','הורה וילד'];
const pair=(i,reverse=false)=>({...calculateExperimentalSynastry(...(reverse?[...controlPeople[i]].reverse():controlPeople[i]),resolver),relationship:rel[i]});
const prose=r=>r.report.chapters.map(c=>c.paragraphs.map(p=>[p.title,p.text]));
test('variable evidence selection, exact numeric provenance, ownership and semantic ledger on three calculated pairs',()=>{
 const counts=[];
 for(let i=0;i<3;i++){
  const p=pair(i),before=JSON.stringify(p),r=createSynthesisInterpretation(p,{participants:roles(i)}),old=createGeneralInterpretation(p,{participants:roles(i)});
  assert.equal(JSON.stringify(p),before);assert.deepEqual(r.facts,old.facts);assert.equal(r.report.scope.otherChapters,false);assert.equal(r.report.scope.phaseD,true);
  const index=new Map(r.facts.facts.map(f=>[f.id,f])),owned=[];
  for(const t of r.report.selectionTrace){counts.push(t.selected.length);for(const item of t.selected){owned.push(item.factId);assert.equal(item.orb,index.get(item.factId).orb);assert.equal(item.limit,index.get(item.factId).limit);if(item.role==='secondary')assert.ok(!item.central);}
   for(const shared of t.shared)assert.ok(r.report.selectionTrace.find(x=>x.topic===shared.coveredIn).selected.some(x=>x.factId===shared.factId));
  }
  assert.equal(new Set(owned).size,owned.length);
  const concepts=r.report.semanticLedger.map(x=>x.key);assert.equal(new Set(concepts).size,concepts.length);
  for(const c of r.report.chapters)for(const p of c.paragraphs)for(const q of p.claims){assert.ok(q.evidenceIds.length);assert.ok(concepts.includes(q.conceptKey));for(const id of q.evidenceIds)assert.ok(index.has(id));}
 }
 assert.ok(counts.some(x=>x>2));assert.ok(new Set(counts).size>=3);
});
test('all three pairs retain identical full prose after participant order reversal',()=>{
 for(let i=0;i<3;i++)assert.deepEqual(prose(createSynthesisInterpretation(pair(i,true),{participants:roles(i).reverse()})),prose(createSynthesisInterpretation(pair(i),{participants:roles(i)})));
});
test('family/friendship roles are explicit, nonromantic, and independent of name or order',()=>{
 for(let i=0;i<3;i++)for(const relationship of ['חברות','אחים','הורה וילד']){
  const p=pair(i);p.relationship=relationship;const r=createSynthesisInterpretation(p,{participants:[{id:'first',role:'child'},{id:'second',role:'parent'}]}),text=JSON.stringify(prose(r));
  for(const w of ['רומנטי','משיכה מינית','תשוקה','מאהב','זוגית'])assert.ok(!text.includes(w));
 }
 assert.throws(()=>createSynthesisInterpretation(pair(2),{participants:[{id:'first'},{id:'second'}]}));
});
test('unverified snapshots reject, boundary contacts cannot anchor, optional points do not enter synthesis',()=>{
 const p=pair(0);p.aspects[0].orb+=1;assert.throws(()=>createSynthesisInterpretation(p,{participants:roles(0)}));
 for(let i=0;i<3;i++){
  const p=pair(i),r=createSynthesisInterpretation(p,{participants:roles(i)}),index=new Map(r.facts.facts.map(f=>[f.id,f]));
  for(const t of r.report.selectionTrace)for(const x of t.selected){assert.ok(!index.get(x.factId).nearBoundary);assert.ok(!/Node|Lilith/.test(x.key));}
 }
});
test('local personal case is recomputed, stays outside public output, and has unique source ownership',{skip:!existsSync(new URL('../interpretation/private/reference-input.json',import.meta.url))},()=>{
 const input=JSON.parse(readFileSync(new URL('../interpretation/private/reference-input.json',import.meta.url)));
 const p={...calculateExperimentalSynastry(...input.people,resolver),relationship:input.relationship};
 const r=createSynthesisInterpretation(p,{participants:roles(0)}),old=createGeneralInterpretation(p,{participants:roles(0)});assert.deepEqual(r.facts,old.facts);
 const keys=r.report.selectionTrace.flatMap(t=>t.selected.map(x=>x.key));assert.equal(new Set(keys).size,keys.length);
 const reverse={...calculateExperimentalSynastry(...[...input.people].reverse(),resolver),relationship:input.relationship};assert.deepEqual(prose(createSynthesisInterpretation(reverse,{participants:roles(0).reverse()})),prose(r));
});

test('unseen calculated pair and identical display names do not alter semantic selection',()=>{
 const people=[controlPeople[0][0],controlPeople[1][1]],p={...calculateExperimentalSynastry(...people,resolver),relationship:'חברות'};
 const r=createSynthesisInterpretation(p,{participants:roles(0)});p.charts.forEach(c=>c.name='אותו שם');const renamed=createSynthesisInterpretation(p,{participants:roles(0)});
 const selected=x=>x.report.selectionTrace.map(t=>({rule:t.synthesisRule,keys:t.selected.map(x=>x.key)}));assert.deepEqual(selected(renamed),selected(r));
 const extra={...calculateExperimentalSynastry(...controlPeople[0],resolver,{includeMeanNodes:true,includeMeanLilith:true}),relationship:'זוגיות'};
 assert.deepEqual(prose(createSynthesisInterpretation(extra,{participants:roles(0)})),prose(createSynthesisInterpretation(pair(0),{participants:roles(0)})));
});
