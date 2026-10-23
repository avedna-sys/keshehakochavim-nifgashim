import {createBirthContext} from './birth-location.js';
import {calculateExperimentalSynastry} from '../research/astronomy-engine/synastry.mjs';

// Adapter for the existing forms. All time conversion on this path uses the
// pinned, tested full TZDB resolver; never the browser's historical Intl data.
export function createIntegratedSynastry(request,locations,resolver,options={}){
 const resolveTime=(date,time,timeZone)=>{
  if(!time)return {status:'unknown-time',instant:null,timeZone};
  const value=resolver.resolve(date,time,timeZone);
  return {...value,...(value.status==='resolved'?value.candidates[0]:{instant:null})};
 };
 const people=request.people.map((person,i)=>createBirthContext(person,locations[i],{resolveTime}));
 if(people.some(p=>p.civilTime.status==='unknown-time'))throw new Error('כדי להציג מפה מלאה עם בתים וצירים נדרשת שעת לידה ידועה של שני האנשים. לא נבחרת שעה משוערת.');
 const inputs=people.map(p=>({name:p.name,date:p.date,time:p.time,place:`${p.place} · ${p.country}`,latitude:p.location.latitude,longitude:p.location.longitude,timeZone:p.location.timeZone}));
 const pair=calculateExperimentalSynastry(inputs[0],inputs[1],resolver,options);
 return {...pair,relationship:request.relationship,locations:people.map(p=>p.location)};
}
