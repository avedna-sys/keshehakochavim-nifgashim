// Local research only. Personal data are read from an ignored local input, never bundled publicly.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../../../synastry.mjs';
import {createHistoricalTimeResolver} from '../../../historical-time.mjs';
import {controlPeople} from '../../control-fixtures.mjs';
import {findingLabel} from '../../facts.mjs';
import {renderEditorialReview} from '../../review-render.mjs';
import {createGeneralInterpretation} from '../generate.mjs';
import {createSynthesisInterpretation} from './generate.mjs';
const root=new URL('./',import.meta.url),resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../../../data/tzdb-2026b.json',root))));
const out=new URL('examples/',root);mkdirSync(out,{recursive:true});
const privateOut=new URL('../../private/phase-d/',root);mkdirSync(privateOut,{recursive:true});
const cases=[{names:['אור','טל'],relationship:'זוגיות'},{names:['דנה','רון'],relationship:'חברות'},{names:['יעל','איתן'],relationship:'הורה וילד',roles:['child','parent']}];
const summaries=[];
for(let i=0;i<4;i++){
 if(i===3&&!existsSync(new URL('../../private/reference-input.json',root))){console.log('SKIP optional local personal input: not present');continue;}
 const personal=i===3,s=personal?JSON.parse(readFileSync(new URL('../../private/reference-input.json',root))):cases[i];
 const people=personal?s.people:controlPeople[i].map((p,j)=>({...p,name:s.names[j]}));
 const participants=people.map((_,j)=>({id:j?'second':'first',...(s.roles?{role:s.roles[j]}:{})}));
 const pair={...calculateExperimentalSynastry(...people,resolver),relationship:s.relationship};
 const result=createSynthesisInterpretation(pair,{participants}),old=createGeneralInterpretation(pair,{participants});
 const index=new Map(result.facts.facts.map(f=>[f.id,f])),prefix=personal?'personal-review':`case-${i+1}`,dest=personal?privateOut:out;
 let md=`# ${result.report.names.join(' ו')} — ${s.relationship}\n\n${result.report.disclosure}\n`;
 for(const c of result.report.chapters){md+=`\n## ${c.title}\n`;for(const p of c.paragraphs)md+=`\n### ${p.title}\n\n${p.text}\n`;}
 md+='\n## מקורות מחושבים — בנפרד\n';for(const c of result.report.chapters)for(const p of c.paragraphs){md+=`\n### ${p.id} — ${p.title}\n`;for(const id of p.evidenceIds)md+=`\n- ${p.sourceOnlyEvidenceIds?.includes(id)?'מקור בלבד — ללא ניתוח נפרד: ':''}${findingLabel(index.get(id),result.facts.names)}\n`;}
 const counts=result.report.selectionTrace.map((t,j)=>({topic:t.topic,oldCount:old.report.selectionTrace[j].selected.length,newCount:t.selected.length,roles:t.selected.map(x=>x.role),shared:t.shared.length,omitted:t.omitted.length,groups:t.groups.map(g=>g.theme)}));
 writeFileSync(new URL(prefix+'.json',dest),JSON.stringify({...result,comparison:counts},null,2)+'\n');writeFileSync(new URL(prefix+'.md',dest),md);writeFileSync(new URL(prefix+'.html',dest),renderEditorialReview(result.facts,result.report));
 summaries.push({case:personal?'private-local-only':i+1,chapters:counts});
}
writeFileSync(new URL('comparison.json',out),JSON.stringify(summaries,null,2)+'\n');console.log(JSON.stringify(summaries,null,2));
