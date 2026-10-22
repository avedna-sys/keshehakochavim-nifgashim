import {buildFindings} from '../facts.mjs';
import {pointInfo} from '../../synastry.mjs';
import {composeThematicChapter} from './thematic.mjs';
import {version,bodyFunctions,relationshipNotes} from './lexicon.mjs';
const mainBodies=new Set(Object.keys(bodyFunctions));
const unique=a=>[...new Set(a)];
// Uses original generic mechanism/resource/friction seeds, not any personal draft.
export function createGeneralInterpretation(pair,{participants}={}){
 const model=buildFindings(pair),index=new Map(model.facts.map(f=>[f.id,f]));
 if(!participants||participants.length!==2||participants.some(p=>!p||!/^[-_a-zA-Z0-9]{1,64}$/.test(p.id))||participants[0].id===participants[1].id)throw Error('Two distinct stable participant IDs required');
 if(model.relationship==='הורה וילד'&&participants.map(p=>p.role).sort().join('|')!=='child|parent')throw Error('Explicit parent/child roles required');
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));
 const name=i=>model.names[i],pid=i=>i?'B':'A',pos=(i,b)=>index.get(`pos:${pid(i)}:${b}`),overlay=(i,b)=>index.get(`overlay:${pid(i)}:${b}:in:${pid(1-i)}`);
 const body=b=>pointInfo[b][0];
 const stableKey=a=>[[participants[0].id,a.first],[participants[1].id,a.second]].sort((a,b)=>a[0].localeCompare(b[0])).map(x=>x.join(':')).join('|')+':'+a.type;
 const rank=a=>[a.nearBoundary?1:0,a.orb/a.limit,a.orb,stableKey(a)];
 const compare=(a,b)=>{const x=rank(a),y=rank(b);for(let i=0;i<3;i++)if(Math.abs(x[i]-y[i])>1e-10)return x[i]-y[i];return x[3].localeCompare(y[3]);};
 const owner=(a,focus)=>a.first===focus&&a.second===focus?order[0]:a.first===focus?0:1;
 const otherBody=(a,focus)=>owner(a,focus)===0?a.second:a.first;
 const evidenceText=a=>`${body(order[0]===0?a.first:a.second)} של ${name(order[0])} ${({conjunction:'בצמידות ל',opposition:'במולות ל',square:'בריבוע ל',trine:'במשולש ל',sextile:'במשושה ל'})[a.type]}${body(order[1]===0?a.first:a.second)} של ${name(order[1])}`;
 const chapters=[],trace=[];
 for(const topic of ['communication','emotions']){
  const focus=topic==='communication'?'Mercury':'Moon',house=topic==='communication'?3:4;
  const contacts=model.facts.filter(f=>f.kind==='aspect'&&mainBodies.has(f.first)&&mainBodies.has(f.second)&&(f.first===focus||f.second===focus)).sort(compare);
  const selected=[];if(contacts[0])selected.push(contacts[0]);
  const opposite=contacts.find(f=>selected[0]&&owner(f,focus)!==owner(selected[0],focus)&&!f.nearBoundary&&f.orb/f.limit<=.65&&!selected.includes(f));
  const second=opposite||contacts.find(f=>!selected.includes(f));if(second)selected.push(second);
  const composition=composeThematicChapter({topic,focus,house,selected,order,participants,model,pos,overlay,body,name,owner,otherBody,evidenceText});
  const paragraphs=composition.blocks.map((block,i)=>{
   const claims=block.paragraphs.map((p,j)=>{
    const refs=unique(p.refs);if(!refs.length||refs.some(id=>!index.has(id)))throw Error('Untraced thematic claim');
    return{id:`${topic}:${i+1}:${j+1}`,text:p.text,evidenceIds:refs,baseKeys:unique(refs.flatMap(id=>index.get(id).baseKeys)),policyRefs:[version,'relationship:'+model.relationship,'motif:'+composition.motif],kind:'symbolic'};
   });
   return{id:`${topic}:${i+1}`,ruleId:`general.${topic}.${composition.motif}.${block.kind}`,title:block.title,text:claims.map(c=>c.text).join('\n\n'),claims,evidenceIds:unique(claims.flatMap(c=>c.evidenceIds)),role:'symbolic',semanticKind:block.kind};
  });
  trace.push({topic,selected:selected.map(f=>({factId:f.id,key:stableKey(f),orb:f.orb,limit:f.limit,relativeOrb:f.orb/f.limit,role:f.nearBoundary||f.orb/f.limit>.65?'secondary':'anchor-candidate'})),omitted:contacts.filter(f=>!selected.includes(f)).map(f=>({factId:f.id,key:stableKey(f),reason:'bounded phase-C selection; unchanged from v0.1'})),rulers:composition.rulers,rulerContacts:composition.rulerContacts,synthesisRule:composition.motif,narrativePlan:composition.plan});
  chapters.push({id:topic,title:topic==='communication'?'תקשורת':'רגשות',paragraphs});
 }
 return{facts:model,report:{version,status:'general-library-phase-c-revised-awaiting-editorial-review',names:model.names,relationship:model.relationship,disclosure:'הנתונים מחושבים; הפרשנות סמלית. זוהי גרסת ביקורת של שלב ג׳, לשני פרקים בלבד. '+relationshipNotes[model.relationship]+(model.relationship==='הורה וילד'?' בתפקיד הורה: '+name(participants.findIndex(p=>p.role==='parent'))+'; בתפקיד ילד בקשר: '+name(participants.findIndex(p=>p.role==='child'))+'.':''),participants:participants.map((p,i)=>({...p,name:name(i)})),chapters,selectionTrace:trace,scope:{chapters:['communication','emotions'],otherChapters:false,phaseD:false,meanPoints:false,axes:false,motion:false},coverage:{context:'Thematic rules selected from actual contacts, sign/house context and traditional rulers. Fallback for other covered contacts.',limits:'Two focus contacts per chapter; thematic interpretation remains an editorial draft and is not a complete reading of every contact.'}}};
}
