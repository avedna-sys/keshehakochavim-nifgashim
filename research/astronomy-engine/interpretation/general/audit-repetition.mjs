// Mechanical repetition metrics are diagnostics, not proof of professional quality.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url);
const oldReports=[1,2,3].map(i=>JSON.parse(readFileSync(new URL(`history/v0.1/case-${i}.json`,root))));
const newReports=[1,2,3].map(i=>JSON.parse(readFileSync(new URL(`examples/case-${i}.json`,root))));
function normalize(s,names){for(const n of names)s=s.split(n).join('משתתף');return s.replace(/\d+(?:\.\d+)?/g,'מספר').replace(/[״׳"'־–—,:()]/g,' ').replace(/\s+/g,' ').trim();}
function measure(reports){
 const titles=reports.flatMap(r=>r.report.chapters.flatMap(c=>c.paragraphs.map(p=>p.title))),sentences=new Map(),grams=new Map();let totalTokens=0;const corpora=[];
 reports.forEach((r,i)=>{
  const raw=r.report.chapters.flatMap(c=>c.paragraphs.map(p=>p.text)).join('\n'),tokens=normalize(raw,r.report.names).split(/\s+/);totalTokens+=tokens.length;corpora.push(tokens);
  for(const sentence of raw.split(/[.!?;\n]+/)){const n=normalize(sentence,r.report.names);if(n.split(/\s+/).length<12)continue;if(!sentences.has(n))sentences.set(n,new Set());sentences.get(n).add(i);}
  for(let j=0;j<=tokens.length-12;j++){const gram=tokens.slice(j,j+12).join(' ');if(!grams.has(gram))grams.set(gram,new Set());grams.get(gram).add(i);}
 });
 const shared=new Set([...grams].filter(([,ids])=>ids.size>1).map(([g])=>g));let covered=0;
 for(const tokens of corpora){const marks=new Set();for(let j=0;j<=tokens.length-12;j++)if(shared.has(tokens.slice(j,j+12).join(' ')))for(let k=j;k<j+12;k++)marks.add(k);covered+=marks.size;}
 return{titleCount:titles.length,uniqueTitles:new Set(titles).size,repeatedTitles:titles.length-new Set(titles).size,sharedLongSentences:[...sentences].filter(([,s])=>s.size>1).length,shared12WordSequences:shared.size,tokensCoveredBySharedSequences:covered,totalTokens,sharedTokenFraction:covered/totalTokens};
}
const old=measure(oldReports),current=measure(newReports);
const cases=newReports.map((r,i)=>{
 assert.deepEqual(r.facts,oldReports[i].facts,'Numeric findings changed');
 const a=r.report.selectionTrace.map(t=>t.selected.map(f=>[f.key,f.orb,f.limit])),b=oldReports[i].report.selectionTrace.map(t=>t.selected.map(f=>[f.key,f.orb,f.limit]));assert.deepEqual(a,b,'Focus contact selection changed');
 return{case:i+1,relationship:r.report.relationship,oldTitles:oldReports[i].report.chapters.map(c=>c.paragraphs.map(p=>p.title)),newTitles:r.report.chapters.map(c=>c.paragraphs.map(p=>p.title)),narrativePlans:r.report.selectionTrace.map(t=>({topic:t.topic,motif:t.synthesisRule,order:t.narrativePlan})),numericFindingsUnchanged:true,focusContactsUnchanged:true};
});
assert.ok(current.repeatedTitles<old.repeatedTitles);assert.ok(current.sharedLongSentences<old.sharedLongSentences);assert.ok(current.sharedTokenFraction<old.sharedTokenFraction);
const result={status:'passed-mechanical-comparison',normalization:'Replace names and numbers; compare sentences of at least 12 words and contiguous 12-word sequences across different reports. Titles evaluated without name substitution.',old,current,cases,limitation:'Repeated technical concepts can be legitimate; lower string overlap does not prove semantic originality, accuracy or literary quality. Human review required.'};
writeFileSync(new URL('examples/repetition-comparison.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({old,current,cases:cases.map(c=>({case:c.case,plans:c.narrativePlans}))},null,2));
