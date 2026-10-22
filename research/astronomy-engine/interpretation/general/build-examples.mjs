// All people and birth inputs here are synthetic test scenarios, not personal records.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../../synastry.mjs';
import {createHistoricalTimeResolver} from '../../historical-time.mjs';
import {controlPeople} from '../control-fixtures.mjs';
import {findingLabel} from '../facts.mjs';
import {renderEditorialReview} from '../review-render.mjs';
import {createGeneralInterpretation} from './generate.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../../data/tzdb-2026b.json',import.meta.url))));
const scenarios=[{names:['אור','טל'],relationship:'זוגיות'},{names:['דנה','רון'],relationship:'חברות'},{names:['יעל','איתן'],relationship:'הורה וילד',roles:['child','parent']}];
const dir=new URL('./examples/',import.meta.url);mkdirSync(dir,{recursive:true});const summaries=[];
for(let i=0;i<scenarios.length;i++){
 const s=scenarios[i],people=controlPeople[i].map((p,j)=>({...p,name:s.names[j]})),participants=people.map((_,j)=>({id:j?'second':'first',...(s.roles?{role:s.roles[j]}:{})}));
 const pair={...calculateExperimentalSynastry(...people,resolver),relationship:s.relationship},output=createGeneralInterpretation(pair,{participants});
 const index=new Map(output.facts.facts.map(f=>[f.id,f]));
 const prefix=`case-${i+1}`;writeFileSync(new URL(prefix+'.json',dir),JSON.stringify({...output,fixture:{synthetic:true,people}},null,2)+'\n');
 writeFileSync(new URL(prefix+'.html',dir),renderEditorialReview(output.facts,output.report));
 let md=`# ${s.names.join(' ו')} — ${s.relationship}\n\nנתוני בדיקה סינתטיים במפורש; המפות חושבו כעת במנוע הקיים.\n\n${output.report.disclosure}\n`;
 for(const c of output.report.chapters){md+=`\n## ${c.title}\n`;for(const p of c.paragraphs)md+=`\n### ${p.title}\n\n${p.text}\n`;}
 md+='\n## המקורות המחושבים — בנפרד\n';
 for(const c of output.report.chapters)for(const p of c.paragraphs){md+=`\n### ${c.title}: ${p.title}\n`;for(const id of p.evidenceIds)md+=`\n- ${findingLabel(index.get(id),output.facts.names)}\n`;}
 writeFileSync(new URL(prefix+'.md',dir),md);
 summaries.push({case:i+1,synthetic:true,relationship:s.relationship,chapters:output.report.selectionTrace.map(t=>({topic:t.topic,selected:t.selected.map(f=>({label:findingLabel(index.get(f.factId),output.facts.names),key:f.key,role:f.role})),rulers:t.rulers.map(id=>findingLabel(index.get(id),output.facts.names)),synthesisRule:t.synthesisRule,omittedFocusContacts:t.omitted.length}))});
}
writeFileSync(new URL('comparison.json',dir),JSON.stringify({status:'generated-from-current-engine',scope:'phase C only; not editorial or scientific approval',cases:summaries},null,2)+'\n');
console.log('Generated three synthetic pairs: complete communication/emotions reports, separate sources, selection traces and comparison.');
