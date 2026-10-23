// Editorial relevance only; astronomical aspect limits are unchanged.
export const version='phase-e-0.2-awaiting-professional-review';
export const core=['Sun','Moon','Venus','Mars','Pluto'];
export const chapterHouses={love:[5,7],attraction:[5,8],intimacy:[7,8]};
const personal=new Set(['Sun','Moon','Mercury','Venus','Mars']);
export const families={
 'Sun|Venus':['love','Sun','recognition'], 'Moon|Venus':['love','Moon','receptivity'], 'Venus|Venus':['love','Venus','values'],
 'Moon|Sun':['love','Moon','identity-and-needs'], 'Moon|Moon':['love','Moon','familiarity'], 'Sun|Sun':['love','Sun','self-expression'],
 'Mars|Venus':['attraction','Venus','wanting-and-acting'], 'Mars|Mars':['attraction','Mars','tempo'], 'Mars|Sun':['attraction','Sun','initiative'],
 'Mars|Moon':['intimacy','Moon','response-and-vulnerability'], 'Moon|Pluto':['intimacy','Moon','emotional-depth'],
 'Pluto|Venus':['intimacy','Venus','value-and-disclosure'], 'Mars|Pluto':['intimacy','Mars','agency-and-influence'], 'Pluto|Sun':['intimacy','Sun','selfhood-and-influence'],
};
export const familyKey=(a,b)=>[a,b].sort().join('|');
export function selectFindings(model,participants){
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));
 const key=f=>[[participants[0].id,f.first],[participants[1].id,f.second]].sort((a,b)=>a[0].localeCompare(b[0])).flat().join(':')+':'+f.type;
 const plans=Object.fromEntries(Object.keys(chapterHouses).map(x=>[x,{selected:[],omitted:[],shared:[],missing:[]}])) ;
 for(const f of model.facts.filter(f=>f.kind==='aspect')){
  const family=families[familyKey(f.first,f.second)],proposals=[];
  for(const [topic,houses] of Object.entries(chapterHouses)){
   const rulers=model.facts.filter(r=>r.kind==='ruler'&&houses.includes(r.house)&&(r.person===0?f.first:f.second)===r.ruler&&personal.has(r.person===0?f.second:f.first));
   const direct=family?.[0]===topic;if(!direct&&!rulers.length)continue;
   const relative=f.orb/f.limit,eligible=!f.nearBoundary&&(direct||relative<=.35&&f.orb<=2&&rulers.some(r=>r.quality!=='cusp-sign-sensitive'));
   if(!eligible){plans[topic].omitted.push({factId:f.id,reason:f.nearBoundary?'near-aspect-cutoff':'ruler-channel-not-precise-or-sensitive'});continue;}
   const focal=direct?family[1]:(rulers.sort((a,b)=>b.priority-a.priority||participants[a.person].id.localeCompare(participants[b.person].id))[0].ruler);
   const owner=f.first===focal&&f.second===focal?order[0]:f.first===focal?0:1;
   const central=direct&&(relative<=.35||f.orb<=1),role=central?'central':direct&&relative>.65?'secondary':'reinforcing';
   proposals.push({factId:f.id,key:key(f),topic,direct,focusOwner:owner,focalBody:owner===0?f.first:f.second,counterBody:owner===0?f.second:f.first,theme:direct?family[2]:'house-ruler',rulerIds:rulers.map(r=>r.id),orb:f.orb,limit:f.limit,relativeOrb:relative,central,role,mode:['square','opposition'].includes(f.type)?'tension':['trine','sextile'].includes(f.type)?'resource':'blend',score:(direct?4:1)+(central?1:0)+(1-relative)});
  }
  proposals.sort((a,b)=>Math.abs(b.score-a.score)>1e-10?b.score-a.score:a.topic.localeCompare(b.topic));
  if(proposals.length){const winner=proposals[0];plans[winner.topic].selected.push(winner);for(const x of proposals.slice(1))plans[x.topic].shared.push({...x,coveredIn:winner.topic});}
 }
 for(const [topic,p] of Object.entries(plans)){
  p.selected.sort((a,b)=>Math.abs(b.score-a.score)>1e-10?b.score-a.score:a.key.localeCompare(b.key));
  if(p.selected.some(x=>x.central&&x.mode==='tension'))for(const x of p.selected)if(!x.central&&x.role!=='secondary'&&x.mode==='resource')x.role='balancing';
  for(const [key,entry] of Object.entries(families))if(entry[0]===topic&&!model.facts.some(f=>f.kind==='aspect'&&familyKey(f.first,f.second)===key))p.missing.push(key);
 }
 return plans;
}
