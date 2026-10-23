import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import Swiss from 'sweph';
import {motionAt} from '../position-details.mjs';
Swiss.set_ephe_path(fileURLToPath(new URL('./reference-data/',import.meta.url)));
test('Saturn daily 1800–2026: isolate gravitational deflection without changing threshold or natal model',()=>{
 let count=0,matchedMax=0,matchedFailures=0,standardMax=0,standardFailures=0,classificationMismatches=0,uncertain=0;
 for(let date=Date.UTC(1800,0,1,12);date<Date.UTC(2027,0,1);date+=86400000){
  const jd=date/86400000+2440587.5,dt=Swiss.deltat_ex(jd,2);assert.equal(dt.error,'');const tt=jd+dt.data;
  const actual=motionAt('Saturn',tt),standard=Swiss.calc(tt,6,258),matched=Swiss.calc(tt,6,770);assert.equal(standard.flag,258);assert.equal(matched.flag,770);
  const a=Math.abs(actual.longitudeSpeed-standard.data[3]),b=Math.abs(actual.longitudeSpeed-matched.data[3]);count++;standardMax=Math.max(standardMax,a);matchedMax=Math.max(matchedMax,b);if(a>0.001)standardFailures++;if(b>0.001)matchedFailures++;
  if(actual.motion==='uncertain')uncertain++;else if((actual.motion==='retrograde')!==(matched.data[3]<0))classificationMismatches++;
 }
 const jd=Date.UTC(1975,6,15,12)/86400000+2440587.5,tt=jd+Swiss.deltat_ex(jd,2).data;
 const original={actual:motionAt('Saturn',tt).longitudeSpeed,standardSwiss:Swiss.calc(tt,6,258).data[3],noDeflectionSwiss:Swiss.calc(tt,6,770).data[3]};
 const report={finishedAt:new Date().toISOString(),count,thresholdDegreesPerDay:0.001,standardMax,standardFailures,matchedMax,matchedFailures,classificationMismatches,uncertain,original,conclusion:'Only reference gravitational-deflection flag differs (258 vs 770). AE natal positions and time policy unchanged. Daily/monthly sample, not proof for every instant.'};
 writeFileSync(new URL('./saturn-deflection-audit-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);assert.equal(matchedFailures,0);assert.equal(classificationMismatches,0);
});
