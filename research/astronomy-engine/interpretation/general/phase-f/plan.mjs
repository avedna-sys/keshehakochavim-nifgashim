import {aspectBinding} from '../phase-d/attribution.mjs';
export const version='phase-f-0.3-awaiting-professional-review';
export const seven=['communication','emotions','love','attraction','intimacy','commitment','growth'];
const personal=new Set(['Sun','Moon','Mercury','Venus','Mars']);
const bodies=new Set([...personal,'Jupiter','Saturn','Uranus','Neptune','Pluto']);
export const modeOf=f=>['square','opposition'].includes(f.type)?'tension':['trine','sextile'].includes(f.type)?'resource':'blend';
export const houseProfile=r=>r==='חברות'?[7,11]:r==='אחים'?[3,4]:r==='הורה וילד'?[4]:[4,7];
export function canonicalKey(f,participants){return [[participants[0].id,f.first],[participants[1].id,f.second]].sort((a,b)=>a[0].localeCompare(b[0])).flat().join(':')+':'+f.type;}
export function associatedRulers(model,item){
 const b=aspectBinding(model,item),houses=houseProfile(model.relationship);
 return model.facts.filter(r=>r.kind==='ruler'&&houses.includes(r.house)&&r.quality!=='cusp-sign-sensitive'&&[b.focal,b.counter].some(e=>e.person===r.person&&e.body===r.ruler)).sort((a,c)=>(a.person===b.focal.person?0:1)-(c.person===b.focal.person?0:1)||a.house-c.house);
}
export function closure(model,ids){
 const idx=new Map(model.facts.map(f=>[f.id,f])),seen=new Set();
 function visit(id){if(seen.has(id))return;const f=idx.get(id);if(!f)throw Error('Unknown evidence '+id);seen.add(id);f.refs.forEach(visit);}
 ids.forEach(visit);return [...seen];
}
export function itemRefs(model,item){const b=aspectBinding(model,item);return closure(model,[b.factId,b.focal.positionId,b.focal.overlayId,b.counter.positionId,b.counter.overlayId,...associatedRulers(model,item).map(r=>r.id)]);}
export function commitmentPlan(model,participants){
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id)),selected=[],omitted=[];
 for(const f of model.facts.filter(f=>f.kind==='aspect')){
  if(!bodies.has(f.first)||!bodies.has(f.second))continue;
  const endpoints=[f.first,f.second],outer=endpoints.findIndex((b,i)=>['Saturn','Jupiter'].includes(b)&&personal.has(endpoints[1-i]));
  const rs=model.facts.filter(r=>r.kind==='ruler'&&houseProfile(model.relationship).includes(r.house)&&(r.person?f.second:f.first)===r.ruler&&personal.has(r.person?f.first:f.second)&&r.quality!=='cusp-sign-sensitive');
  if(outer<0&&!rs.length)continue;
  const relativeOrb=f.orb/f.limit;
  if(f.nearBoundary||outer<0&&(relativeOrb>.35||f.orb>2)){omitted.push({factId:f.id,reason:f.nearBoundary?'near-calculation-cutoff':'indirect-not-precise-enough'});continue;}
  const focusOwner=outer>=0?outer:rs.sort((a,b)=>participants[a.person].id.localeCompare(participants[b.person].id))[0].person;
  const direct=outer>=0,central=direct&&(relativeOrb<=.35||f.orb<=1);
  const dimension=(outer>=0?endpoints[outer]+':'+endpoints[1-outer]:'ruler:'+endpoints[focusOwner]+':'+endpoints[1-focusOwner]);
  selected.push({dimension,factId:f.id,key:canonicalKey(f,participants),topic:'commitment',focusOwner,focalBody:endpoints[focusOwner],counterBody:endpoints[1-focusOwner],direct,central,role:central?'central':direct&&relativeOrb>.65?'secondary':'reinforcing',orb:f.orb,limit:f.limit,relativeOrb,mode:modeOf(f),score:(direct?3:1)+(central?1:0)+(1-relativeOrb),rulerIds:rs.map(r=>r.id)});
 }
 selected.sort((a,b)=>Math.abs(b.score-a.score)>1e-10?b.score-a.score:a.key.localeCompare(b.key));
 // Chapter-specific reassessment: broad contacts need distinct function AND context.
 // This is editorial admission, never a change to a calculated aspect or its orb limit.
 const seen=new Set(),active=[],sourceOnly=[];
 for(const item of selected){
  const rulers=associatedRulers(model,item),newFunction=!active.some(i=>i.dimension===item.dimension&&i.focusOwner===item.focusOwner&&i.mode===item.mode);
  const broadCap=model.facts.find(f=>f.id===item.factId).type==='sextile'?3.5:4;
  const contextual=item.role==='secondary'&&item.relativeOrb<=.85&&item.orb<=broadCap&&newFunction&&(rulers.length>0||item.counterBody==='Mercury');
  item.admission={precision:item.central?'close':item.relativeOrb<=.65?'moderate':'broad',houseContext:rulers.map(r=>r.id),newFunction,decision:contextual?'qualified-context':item.role==='secondary'?'sources-only':'normal',reason:contextual?'Distinct responsibility/support function, absolute and relative breadth checked, actual house link or explicit agreement function':item.role==='secondary'?'Too broad for this context; retained as a calculated source':'Relevant direct or precise ruler contact'};
  if(contextual){item.role='contextual';item.score+=rulers.length?0.2:0.1;}
  const key=[participants[item.focusOwner].id,item.focalBody,item.counterBody,item.mode].join(':');
  if(item.role==='secondary'||seen.has(key))sourceOnly.push(item);else{seen.add(key);active.push(item);}
 }

 return {selected,active,sourceOnly,omitted};
}
export function channel(item){
 const bodies=[item.focalBody,item.counterBody];
 if(bodies.includes('Mercury'))return 'communication';
 if(bodies.includes('Moon'))return 'emotions';
 if(bodies.includes('Venus'))return 'affection';
 if(bodies.includes('Mars'))return 'action';
 return 'direction';
}
export function makeLedger(model,participants,traces){
 const map=new Map();
 for(const t of traces)for(const item of t.selected){
  const prev=map.get(item.factId),rank=item.central?3:item.role==='secondary'?0:1;
  if(!prev)map.set(item.factId,{factId:item.factId,key:item.key,origins:[t.topic],representative:item,rank});
  else{if(!prev.origins.includes(t.topic))prev.origins.push(t.topic);if(rank>prev.rank||(rank===prev.rank&&(item.relativeOrb<prev.representative.relativeOrb||item.relativeOrb===prev.representative.relativeOrb&&item.key.localeCompare(prev.representative.key)<0))){prev.representative=item;prev.rank=rank;}}
 }
 return [...map.values()].sort((a,b)=>b.rank-a.rank||a.representative.relativeOrb-b.representative.relativeOrb||a.key.localeCompare(b.key)).map(x=>({...x,origins:x.origins.sort((a,b)=>seven.indexOf(a)-seven.indexOf(b)),independentWeight:1}));
}
export function growthPlan(ledger){
 const groups=new Map();
 for(const e of ledger.filter(e=>e.rank>0)){const item=e.representative,c=channel(item);if(!groups.has(c))groups.set(c,[]);groups.get(c).push(item);}
 const patterns=[...groups].map(([domain,items])=>({domain,items}));
 return {patterns,tensions:patterns.flatMap(g=>g.items.filter(i=>i.mode==='tension')),resources:patterns.flatMap(g=>g.items.filter(i=>i.mode==='resource')),blends:patterns.flatMap(g=>g.items.filter(i=>i.mode==='blend')),sourceOnly:[]};
}
export function summaryPlan(ledger,growth){
 const selected=ledger.filter(e=>e.rank>0).map(e=>e.representative);
 return {selected,scope:seven,uniqueAspectCount:ledger.length,primaryCount:ledger.filter(e=>e.rank===3).length};
}
