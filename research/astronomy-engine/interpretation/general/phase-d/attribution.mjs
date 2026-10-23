import {communication,emotions} from '../../content.mjs';
import {signStyles,bodyFunctions} from '../lexicon.mjs';
import {interactionSynthesis} from './interactions.mjs';
import {houseContexts} from '../../content.mjs';
import assert from 'node:assert/strict';
import {pointInfo} from '../../../synastry.mjs';
const pid=i=>i?'B':'A';
const words={conjunction:'בצמידות ל',opposition:'במולות ל',square:'בריבוע ל',trine:'במשולש ל',sextile:'במשושה ל'};
export function aspectBinding(model,item){
 const index=new Map(model.facts.map(f=>[f.id,f])),f=index.get(item.factId);
 assert.ok(f?.kind==='aspect','Aspect evidence required');
 const owner=item.focusOwner,body=owner===0?f.first:f.second,counter=owner===0?f.second:f.first;
 assert.equal(item.focalBody,body,'Wrong focal body/owner');assert.equal(item.counterBody,counter,'Wrong counter body/owner');
 const endpoint=(person,body)=>{const p=index.get(`pos:${pid(person)}:${body}`),o=index.get(`overlay:${pid(person)}:${body}:in:${pid(1-person)}`);return{person,body,positionId:p.id,overlayId:o.id,sign:p.sign,signIndex:p.signIndex,longitude:p.longitude,natalHouse:p.ownHouse.house,target:1-person,partnerHouse:o.house};};
 return{factId:f.id,type:f.type,orb:f.orb,mode:['square','opposition'].includes(f.type)?'tension':['trine','sextile'].includes(f.type)?'resource':'blend',focal:endpoint(owner,body),counter:endpoint(1-owner,counter)};
}
export function bindingAnchor(model,binding,detailed=false){
 const p=e=>`${pointInfo[e.body][0]} של ${model.names[e.person]} ב${e.sign}${detailed?`, בבית ${e.natalHouse}`:''}`;
 return `${p(binding.focal)} ${words[binding.type]}${p(binding.counter)}`;
}
export function renderAspectReading(model,b,detailed){
 const index=new Map(model.facts.map(f=>[f.id,f])),body=x=>pointInfo[x][0],n=model.names[b.focal.person],o=model.names[b.counter.person];
 const entry=(b.focal.body==='Moon'?emotions:b.focal.body==='Mercury'?communication:null)?.[b.counter.body];
 let interpretation=entry?(b.mode==='tension'?`ביטוי מאתגר אפשרי הוא ${entry[2]}.`:b.mode==='resource'?`אפשרות תומכת היא ${entry[1]}.`:`בצמידות הזאת ${entry[0]}, אך קרבת התפקודים אינה הופכת את שתי החוויות לזהות.`):(b.mode==='tension'?`פער בדרך התגובה עלול להקשות על התיאום בין ${bodyFunctions[b.focal.body]} לבין ${bodyFunctions[b.counter.body]}.`:b.mode==='resource'?`נפתחת אפשרות לתאם בין ${bodyFunctions[b.focal.body]} לבין ${bodyFunctions[b.counter.body]}.`:`${bodyFunctions[b.focal.body]} ו${bodyFunctions[b.counter.body]} כרוכים באותו מפגש, בלי להבטיח קצב או צורך זהים.`);
 if(detailed){const style=signStyles[b.focal.body]?.[b.focal.signIndex]??bodyFunctions[b.focal.body];interpretation+=` עבור ${n}, ${style} פוגש כאן ${bodyFunctions[b.counter.body]} של ${o}. ההבדל בין ${houseContexts[b.focal.natalHouse]} במפת ${n} לבין ${houseContexts[b.counter.natalHouse]} במפת ${o} מחדד שאין הכרח שאותו מפגש יקבל אצל שניהם אותה משמעות.`;}
 const f=index.get(b.factId),d=(b.counter.signIndex-b.focal.signIndex+12)%12;
 if(Math.min(d,12-d)*30!==f.angle)interpretation+=' ההיבט חוצה את המבנה המזלי הטיפוסי; משמעות המזלות נשמרת לצד הזווית המחושבת.';
 const anchor=bindingAnchor(model,b,detailed);return{anchorText:anchor,interpretationText:interpretation,text:anchor+' — '+interpretation};
}
export function validateAttribution(model,report){
 const index=new Map(model.facts.map(f=>[f.id,f]));let aspects=0,combined=0;
 for(const chapter of report.chapters)for(const p of chapter.paragraphs)for(const claim of p.claims){
  for(const b of claim.aspectBindings??[]){
   const expected=aspectBinding(model,{factId:b.factId,focusOwner:b.focal.person,focalBody:b.focal.body,counterBody:b.counter.body});
   assert.deepEqual(b,expected,'Mismatched sign, house, ownership, direction or aspect');
   for(const e of [b.focal,b.counter])for(const id of [e.positionId,e.overlayId])assert.ok(claim.evidenceIds.includes(id),'Missing exact endpoint evidence');
   assert.ok(claim.evidenceIds.includes(b.factId));aspects++;
  }
  if(claim.kindOfClaim==='aspect-reading'){
   assert.equal(claim.aspectBindings.length,1,'Individual reading requires one exact aspect');
   assert.ok(claim.text.startsWith(bindingAnchor(model,claim.aspectBindings[0],claim.detailed)+' — '),'Rendered text has foreign or missing endpoint context');
   assert.equal(claim.readingMode,claim.aspectBindings[0].mode,'Reading uses another aspect mode');
   assert.equal(claim.text,claim.anchorText+' — '+claim.interpretationText,'Untracked text modification');
   assert.equal(claim.anchorText,bindingAnchor(model,claim.aspectBindings[0],claim.detailed));
   assert.equal(claim.text,renderAspectReading(model,claim.aspectBindings[0],claim.detailed).text,'Interpretation sentence borrowed a foreign sign, house or owner');
  }
  if(claim.kindOfClaim==='combined-synthesis'){
   assert.ok(claim.aspectBindings.length>0);for(const id of claim.synthesisAspectIds)assert.ok(claim.aspectBindings.some(b=>b.factId===id));
   const items=claim.aspectBindings.map(b=>({factId:b.factId,focusOwner:b.focal.person,focalBody:b.focal.body,counterBody:b.counter.body,mode:b.mode,direct:b.focal.body===(chapter.id==='emotions'?'Moon':'Mercury')}));
   const pos=(i,body)=>index.get(`pos:${pid(i)}:${body}`),overlay=(i,body)=>index.get(`overlay:${pid(i)}:${body}:in:${pid(1-i)}`);
   const recomputed=interactionSynthesis(items,{name:i=>model.names[i],body:b=>pointInfo[b][0],pos,overlay,houseContexts});
   if(recomputed){assert.equal(claim.interactionRule,recomputed.rule);assert.ok(claim.text.startsWith(recomputed.text),'Synthesis text uses foreign endpoints or context');assert.deepEqual([...claim.synthesisAspectIds].sort(),[...recomputed.aspectIds].sort());}
   combined++;
  }
  assert.ok(claim.evidenceIds.every(id=>index.has(id)));
 }
 return{status:'passed',aspectBindingsChecked:aspects,combinedClaimsChecked:combined};
}
