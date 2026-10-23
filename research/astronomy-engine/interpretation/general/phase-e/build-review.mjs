import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../../../synastry.mjs';
import {createHistoricalTimeResolver} from '../../../historical-time.mjs';
import {cases} from './fixtures.mjs';
import {findingLabel} from '../../facts.mjs';
import {renderEditorialReview} from '../../review-render.mjs';
import {createPhaseEInterpretation} from './generate.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../../../data/tzdb-2026b.json',import.meta.url)))),out=new URL('./examples/',import.meta.url);mkdirSync(out,{recursive:true});const summaries=[];let combined='# שלב ה׳ — כל הדוחות המלאים לביקורת\n\nכל נתוני הבדיקה סינתטיים; המיקומים מחושבים בפועל. הפרשנות סמלית.\n';
for(const s of cases){
 const people=s.people.map((p,i)=>({...p,name:s.names[i]})),participants=people.map((_,i)=>({id:i?'second':'first',...(s.roles?{role:s.roles[i]}:{})}));
 const pair={...calculateExperimentalSynastry(...people,resolver),relationship:s.relationship},result=createPhaseEInterpretation(pair,{participants});
 const index=new Map(result.facts.facts.map(f=>[f.id,f]));let md=`# ${s.names.join(' ו')} — ${s.relationship}\n\n${result.report.disclosure}\n`;
 for(const c of result.report.chapters){md+=`\n## ${c.title}\n`;for(const p of c.paragraphs)md+=`\n### ${p.title}\n\n${p.text}\n`;}
 combined+='\n\n---\n\n'+md;
 md+='\n## המקורות המחושבים — בנפרד\n';for(const c of result.report.chapters)for(const p of c.paragraphs){md+=`\n### ${c.title} — ${p.title}\n`;for(const id of p.evidenceIds)md+=`\n- ${p.sourceOnlyEvidenceIds?.includes(id)?'מקור בלבד: ':''}${findingLabel(index.get(id),s.names)}\n`;}
 writeFileSync(new URL(s.id+'.json',out),JSON.stringify({...result,fixture:{synthetic:true,people}},null,2)+'\n');writeFileSync(new URL(s.id+'.md',out),md);
 const html=renderEditorialReview(result.facts,result.report).replace('טיוטה עריכתית אישית · לא לפרסום','טיוטת ספרייה כללית · נתוני בדיקה סינתטיים').replace('הפרקים אינם קובעים התנהגות, משיכה מינית בפועל או עתיד של קשר.','הפרקים אינם קובעים התנהגות או עתיד של קשר.');writeFileSync(new URL(s.id+'.html',out),html);
 summaries.push({id:s.id,relationship:s.relationship,audit:result.report.attributionAudit,chapters:result.report.selectionTrace.map(t=>({topic:t.topic,counts:Object.fromEntries(['central','reinforcing','balancing','secondary'].map(k=>[k,t.selected.filter(x=>x.role===k).length])),missing:t.missing,presentation:t.presentation}))});
}
writeFileSync(new URL('all-reports.md',out),combined);writeFileSync(new URL('coverage.json',out),JSON.stringify(summaries,null,2)+'\n');console.log(JSON.stringify(summaries,null,2));
