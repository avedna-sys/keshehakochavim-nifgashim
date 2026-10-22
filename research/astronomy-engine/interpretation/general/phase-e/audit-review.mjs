import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {cases} from './fixtures.mjs';
const dir=new URL('./examples/',import.meta.url),summaries=[];
for(const fixture of cases){
 const r=JSON.parse(readFileSync(new URL(fixture.id+'.json',dir))),sentences=new Map();
 for(const c of r.report.chapters)for(const p of c.paragraphs)for(let text of p.text.split(/[.!?;\n]+/)){
  for(const name of r.report.names)text=text.split(name).join('אדם');text=text.replace(/\d+(?:\.\d+)?/g,'מספר').replace(/\s+/g,' ').trim();if(text.split(' ').length<12)continue;
  if(!sentences.has(text))sentences.set(text,[]);sentences.get(text).push({chapter:c.id,paragraph:p.id});
 }
 const selected=r.report.selectionTrace.flatMap(t=>t.selected.map(x=>x.factId));assert.equal(new Set(selected).size,selected.length);
 const repeats=[...sentences].filter(([,uses])=>uses.length>1).map(([text,uses])=>({normalizedSentence:text,uses}));
 const report={id:fixture.id,synthetic:true,relationship:fixture.relationship,attribution:r.report.attributionAudit,repeatedLongSentences:repeats.length,repeats,chapters:r.report.chapters.map((c,i)=>({id:c.id,title:c.title,words:c.paragraphs.map(p=>p.text).join(' ').split(/\s+/).length,central:r.report.selectionTrace[i].presentation.central.length,compact:r.report.selectionTrace[i].presentation.compact.length,sourceOnly:r.report.selectionTrace[i].presentation.sourceOnly.length,missing:r.report.selectionTrace[i].missing}))};summaries.push(report);
}
const result={status:'passed-geometric-ownership-and-attribution',cases:summaries,limits:'Literal repetition is a diagnostic, not proof of semantic novelty or literary quality. Shared mechanisms are bounded symbolic rules. No scientific validation of interpretation.'};
writeFileSync(new URL('review-audit.json',dir),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(summaries.map(s=>({id:s.id,audit:s.attribution,repeatedLongSentences:s.repeatedLongSentences,chapters:s.chapters})),null,2));
