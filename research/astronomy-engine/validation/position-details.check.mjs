import test from 'node:test';
import assert from 'node:assert/strict';
import Swiss from 'sweph';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';
import {motionAt,housePlacement,zodiacParts} from '../position-details.mjs';
import {bodies} from '../engine.mjs';
const dir=fileURLToPath(new URL('./reference-data/',import.meta.url));
test('motion vs file-backed Swiss speeds, 1800–2026; fixed 0.001 degree/day threshold',()=>{
 Swiss.set_ephe_path(dir);const flags=258,ids=[...bodies.map((_,i)=>i),10,10,12],names=[...bodies,'MeanNorthNode','MeanSouthNode','MeanLilith'];
 let count=0,max=0,failed=0,uncertain=0,classificationFailures=0,acceptedFailures=0,maxAccepted=0,worst=null;
 for(let y=1800;y<=2026;y++)for(let m=1;m<=12;m++){
  const jd=Date.UTC(y,m-1,15,12)/86400000+2440587.5,dt=Swiss.deltat_ex(jd,2);assert.equal(dt.error,'');
  const tt=jd+dt.data;
  for(let i=0;i<names.length;i++){
   const ref=Swiss.calc(tt,ids[i],flags);assert.equal(ref.flag,flags);assert.equal(ref.error,'');
   const value=motionAt(names[i],tt),error=Math.abs(value.longitudeSpeed-ref.data[3]);count++;
   if(value.motion!=='unverified')maxAccepted=Math.max(maxAccepted,error);
   if(error>max){max=error;worst={year:y,month:m,body:names[i],actual:value.longitudeSpeed,reference:ref.data[3]};}
   if(error>0.001){failed++;if(value.motion!=='unverified')acceptedFailures++;}
   if(value.motion==='uncertain')uncertain++;else if(value.motion!=='unverified'&&(value.motion==='retrograde')!==(ref.data[3]<0))classificationFailures++;
  }
 }
 const report={status:acceptedFailures||classificationFailures?'failed':'passed-with-Saturn-motion-withheld',finishedAt:new Date().toISOString(),count,limitDegreesPerDay:0.001,maxDifferenceDegreesPerDay:max,failed,acceptedFailures,maxAcceptedDifferenceDegreesPerDay:maxAccepted,classificationFailures,uncertain,worst,method:'±5 TT minutes central difference; Swiss TT with matched Delta T; flag 258; near-zero classification withheld'};
 writeFileSync(new URL('./position-details-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);assert.equal(acceptedFailures,0);assert.equal(classificationFailures,0);
});
test('house boundaries, wrap and minute display do not invent zodiac rollover',()=>{
 const cusps=Array.from({length:12},(_,i)=>(350+i*30)%360);
 assert.equal(housePlacement(350,cusps).house,1);assert.equal(housePlacement(19.999,cusps).house,1);assert.equal(housePlacement(20,cusps).house,2);assert.equal(housePlacement(349,cusps).house,12);assert.equal(housePlacement(350.001,cusps).nearCusp,true);
 assert.deepEqual([zodiacParts(29.9999).signIndex,zodiacParts(29.9999).degree,zodiacParts(29.9999).minute],[0,29,59]);assert.equal(zodiacParts(360).signIndex,0);
});
