import {validateAttribution} from './attribution.mjs';
import {buildFindings} from '../../facts.mjs';
import {relationshipNotes} from '../lexicon.mjs';
import {buildSynthesisPlan,policyVersion} from './plan.mjs';
import {composeSynthesis} from './compose.mjs';
export function createSynthesisInterpretation(pair,{participants}={}){
 if(!participants||participants.length!==2||participants.some(p=>!p||!/^[-_a-zA-Z0-9]{1,64}$/.test(p.id))||participants[0].id===participants[1].id)throw Error('Two distinct stable participant IDs required');
 const facts=buildFindings(pair);
 if(facts.relationship==='הורה וילד'&&participants.map(p=>p.role).sort().join('|')!=='child|parent')throw Error('Explicit parent/child roles required');
 const plan=buildSynthesisPlan(facts,participants),composition=composeSynthesis(facts,participants,plan);
 const result={facts,report:{version:policyVersion,status:'phase-d-experimental-awaiting-review',names:facts.names,relationship:facts.relationship,disclosure:'הנתונים חושבו במנוע הניסיוני הקיים; הפרשנות סמלית ואינה עובדה פסיכולוגית. שלב ד׳ לתקשורת ולרגשות בלבד. '+relationshipNotes[facts.relationship],participants:participants.map((p,i)=>({...p,name:facts.names[i]})),chapters:composition.chapters,selectionTrace:composition.trace,semanticLedger:composition.semanticLedger,selectionPolicy:plan.policy,scope:{chapters:['communication','emotions'],otherChapters:false,phaseD:true,meanPoints:false,axes:false,motion:false},coverage:{limits:'Rule-based editorial synthesis, not a complete catalogue of every possible configuration or scientific validation of symbolic meaning.'}}};
 result.report.attributionAudit=validateAttribution(facts,result.report);return result;
}
