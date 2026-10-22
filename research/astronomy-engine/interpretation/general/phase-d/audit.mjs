import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('./',import.meta.url);
const current=[1,2,3].map(i=>JSON.parse(readFileSync(new URL(`examples/case-${i}.json`,root))));
const old=[1,2,3].map(i=>JSON.parse(readFileSync(new URL(`../history/phase-d-0.1/case-${i}.json`,root))));
const normalized=(s,names)=>{for(const n of names)s=s.split(n).join('אדם');return s.replace(/\d+(?:\.\d+)?/g,'מספר').replace(/[״׳"'־–—,:()]/g,' ').replace(/\s+/g,' ').trim();};
function repeated(reports){
 const sentences=new Map();let total=0;
 for(let i=0;i<reports.length;i++)for(const c of reports[i].report.chapters)for(const p of c.paragraphs)for(const raw of p.text.split(/[.!?;\n]+/)){
  const n=normalized(raw,reports[i].report.names);if(n.split(/\s+/).length<12)continue;total++;
  if(!sentences.has(n))sentences.set(n,[]);sentences.get(n).push({case:i+1,chapter:c.id,paragraph:p.id});
 }
 return{longSentences:total,sharedAcrossReports:[...sentences.values()].filter(a=>new Set(a.map(x=>x.case)).size>1).length,repeatedWithinAReport:[...sentences.values()].filter(a=>new Set(a.map(x=>x.case)).size<a.length).length};
}
const cases=current.map((r,i)=>{
 assert.deepEqual(r.facts,old[i].facts);
 const owned=r.report.selectionTrace.flatMap(t=>t.selected.map(x=>x.factId));assert.equal(owned.length,new Set(owned).size);
 const concepts=r.report.semanticLedger.map(x=>x.key);assert.equal(concepts.length,new Set(concepts).size);
 return{case:i+1,findingsUnchanged:true,duplicateNarratedEdges:0,duplicateRegisteredConcepts:0,chapters:r.report.selectionTrace.map((t,j)=>({topic:t.topic,oldCount:old[i].report.selectionTrace[j].selected.length,count:t.selected.length,central:t.selected.filter(x=>x.role==='central').length,reinforcing:t.selected.filter(x=>x.role==='reinforcing').length,balancing:t.selected.filter(x=>x.role==='balancing').length,secondary:t.selected.filter(x=>x.role==='secondary').length,shared:t.shared.length,rule:t.synthesisRule}))};
});
const result={status:'passed-provenance-and-ownership',cases,literalRepetition:{before:repeated(old),after:repeated(current)},limits:'Semantic keys and unique geometric ownership prevent registered duplicates, not every possible paraphrase. Literal repetition is diagnostic only; expanded coverage changes text length. Professional review remains necessary.'};
assert.equal(result.literalRepetition.after.repeatedWithinAReport,0,'Repeated long sentences within a report');
writeFileSync(new URL('examples/audit.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
