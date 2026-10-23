import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../../../synastry.mjs';
import {createHistoricalTimeResolver} from '../../../historical-time.mjs';
import {findingLabel} from '../../facts.mjs';
import {createPhaseFInterpretation} from './generate.mjs';
import {cases} from './fixtures.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../../../data/tzdb-2026b.json',import.meta.url))));
const dir=new URL('./examples/',import.meta.url);mkdirSync(dir,{recursive:true});
let evidenceIndex='# שלב ו׳ — קטלוג המקורות והאורבים\n\nכל שורה היא היבט גאומטרי אחד, גם כאשר הוא משמש בכמה פרקים. הדירוג הוא עריכתי, לא מדד לאמיתות הפרשנות.\n';
const reviews=[];let combined=`# שלב ו׳ — כל הפרקים המלאים

כל המפות סינתטיות, חושבו מחדש במנוע הקיים, והפרשנות סמלית.
`;
for(const fixture of cases){
 const people=fixture.people.map((p,i)=>({...p,name:fixture.names[i]})),participants=people.map((_,i)=>({id:i?'second':'first',...(fixture.roles?{role:fixture.roles[i]}:{})}));
 const pair={...calculateExperimentalSynastry(...people,resolver),relationship:fixture.relationship};
 const result=createPhaseFInterpretation(pair,{participants}),idx=new Map(result.facts.facts.map(f=>[f.id,f]));
 let prose=`# ${fixture.names.join(' ו')} — ${fixture.relationship}\n\n${result.report.disclosure}\n`;
 for(const c of result.report.chapters){prose+=`\n## ${c.title}\n`;for(const p of c.paragraphs)prose+=`\n### ${p.title}\n\n${p.text}\n`;}
 evidenceIndex+=`\n## ${fixture.names.join(' ו')} — ${fixture.relationship}\n\n| ממצא | דירוג | תחומי מקור |\n|---|---|---|\n`;
 for(const row of result.report.ledger)evidenceIndex+=`| ${findingLabel(idx.get(row.factId),result.report.names)} | ${row.rank===3?'מרכזי':row.rank===1?(row.representative.role==='contextual'?'הקשר מתון':'מחזק'):'משני — מקורות בלבד'} | ${row.origins.map(topic=>result.report.coverage.find(c=>c.topic===topic).label).join(', ')} |\n`;
 let sources='\n# המקורות המחושבים — בנפרד\n';
 for(const c of result.report.chapters)for(const p of c.paragraphs){sources+=`\n## ${c.title}: ${p.id}\n`;for(const id of p.evidenceIds)sources+=`\n- ${p.sourceOnlyEvidenceIds.includes(id)?'מקור בלבד: ':''}${findingLabel(idx.get(id),result.report.names)}\n`;}
 writeFileSync(new URL(fixture.id+'.json',dir),JSON.stringify({...result,fixture:{synthetic:true}},null,2)+'\n');
 writeFileSync(new URL(fixture.id+'.md',dir),prose+sources);combined+='\n\n---\n\n'+prose+sources;
 reviews.push({id:fixture.id,relationship:fixture.relationship,audit:result.audit,paragraphs:result.report.chapters.map(c=>({chapter:c.id,count:c.paragraphs.length})),counts:result.report.coverage});
}
writeFileSync(new URL('all-reports.md',dir),combined);writeFileSync(new URL('EVIDENCE_INDEX.md',dir),evidenceIndex);
writeFileSync(new URL('coverage.json',dir),JSON.stringify(reviews,null,2)+'\n');console.log(JSON.stringify(reviews.map(r=>({id:r.id,audit:r.audit,paragraphs:r.paragraphs})),null,2));
