// Editorial thresholds are not changes to astronomical aspect limits.
export const policyVersion='phase-d-synthesis-0.2-attributed';
const personal=new Set(['Sun','Moon','Mercury','Venus','Mars']);
export const topicFocus={communication:'Mercury',emotions:'Moon'};
export function buildSynthesisPlan(model,participants){
 const order=[0,1].sort((a,b)=>participants[a].id.localeCompare(participants[b].id));
 const key=f=>[[participants[0].id,f.first],[participants[1].id,f.second]].sort((a,b)=>a[0].localeCompare(b[0])).flat().join(':')+':'+f.type;
 const stablePerson=i=>participants[i].id;
 const plans={communication:{selected:[],omitted:[],shared:[]},emotions:{selected:[],omitted:[],shared:[]}},proposals=new Map();
 for(const [topic,focus] of Object.entries(topicFocus)){
  const house=topic==='communication'?3:4;
  const rulers=model.facts.filter(f=>f.kind==='ruler'&&f.house===house);
  for(const f of model.facts.filter(f=>f.kind==='aspect')){
   if(!['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].includes(f.first)||!['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].includes(f.second))continue;
   const direct=f.first===focus||f.second===focus;
   const linked=rulers.filter(r=>(r.person===0?f.first:f.second)===r.ruler&&personal.has(r.person===0?f.second:f.first));
   if(!direct&&!linked.length)continue;
   const sensitive=f.nearBoundary||(!direct&&linked.every(r=>r.quality==='cusp-sign-sensitive'));
   const relative=f.orb/f.limit;
   // No quota: every qualified direct contact, and precise relevant ruler channel, is considered.
   const eligible=!sensitive&&(direct?true:(relative<=.35&&f.orb<=2));
   if(!eligible){plans[topic].omitted.push({factId:f.id,key:key(f),reason:sensitive?'sensitive-boundary':'secondary-outside-editorial-relevance-band'});continue;}
   const focusOwner=f.first===focus&&f.second===focus?order[0]:f.first===focus?0:f.second===focus?1:linked.slice().sort((a,b)=>stablePerson(a.person).localeCompare(stablePerson(b.person)))[0].person;
   const focalBody=direct?focus:(focusOwner===0?f.first:f.second),counterBody=focusOwner===0?f.second:f.first;
   const mode=['square','opposition'].includes(f.type)?'tension':['trine','sextile'].includes(f.type)?'resource':'blend';
   const relevance=direct?3:1;
   const central=direct&&(relative<=.35||f.orb<=1);
   const item={factId:f.id,key:key(f),topic,focusOwner,focalBody,counterBody,direct,rulerIds:linked.map(r=>r.id),orb:f.orb,limit:f.limit,relativeOrb:relative,mode,relevance,central,score:relevance+(central?1:0)+(1-relative),role:central?'central':direct&&relative>.65?'secondary':'reinforcing'};
   if(!proposals.has(f.id))proposals.set(f.id,[]);proposals.get(f.id).push(item);
  }
 }
 // A Mercury–Moon edge (or an edge involving a shared ruler) has one narrative owner.
 for(const items of proposals.values()){
  items.sort((a,b)=>Math.abs(b.score-a.score)>1e-10?b.score-a.score:(a.topic==='emotions'?-1:1));
  const winner=items[0];plans[winner.topic].selected.push(winner);
  for(const item of items.slice(1)){plans[item.topic].shared.push({...item,coveredIn:winner.topic,reason:'same-computed-edge-already-narrated'});}
 }
 for(const p of Object.values(plans)){
  p.selected.sort((a,b)=>Math.abs(b.score-a.score)>1e-10?b.score-a.score:a.key.localeCompare(b.key));
  const hasTension=p.selected.some(x=>x.central&&x.mode==='tension');
  for(const item of p.selected)if(!item.central&&item.role!=='secondary'&&item.mode==='resource'&&hasTension)item.role='balancing';
 }
 return{version:policyVersion,plans,policy:{selection:'Every non-boundary direct contact; relative orb > .65 is secondary only. Ruler-only relative orb <= .35 and absolute orb <= 2°. No count cap. Sensitive edges do not anchor.',central:'Direct and relative orb <= .35 or absolute orb <= 1°. Resources do not cancel tensions; conjunction is blend.',ownership:'One narrative owner per geometric edge; emotions wins equal relevance for Mercury–Moon. Stable IDs break numeric ties.'}};
}
