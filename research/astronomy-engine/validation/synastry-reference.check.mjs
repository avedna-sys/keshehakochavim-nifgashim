import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Swiss from 'sweph';
import {calculateNatal,bodies} from '../engine.mjs';
import {interAspects,aspectRules} from '../synastry.mjs';
test('fresh two-person aspect separations/orbs vs Swiss, same UTC/UT1 profile',()=>{
 const startedAt=new Date().toISOString(),provenance=JSON.parse(readFileSync(new URL('./reference-provenance.json',import.meta.url))),directory=fileURLToPath(new URL('./reference-data/',import.meta.url));
 for(const [file,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(readFileSync(directory+file)).digest('hex'),hash);
 Swiss.set_ephe_path(directory);
 const dates=['1800-01-01T00:00:00Z','1850-06-15T12:34:56Z','1900-01-01T12:00:00Z','1930-01-01T11:40:28Z','1950-06-15T12:34:56Z','1990-05-17T06:30:00Z','1992-10-08T17:45:00Z','2000-01-01T12:00:00Z','2016-11-15T12:34:56Z','2026-12-31T23:59:59Z'];
 const charts=dates.map(utc=>({utc,ae:calculateNatal({utc,latitude:31.7683,longitude:35.2137}).planets,swiss:bodies.map((body,id)=>{const r=Swiss.calc_ut(Date.parse(utc)/86400000+2440587.5,id,258);assert.equal(r.flag,258);assert.equal(r.error,'');return r.data[0];})}));
 let pairs=0,planetPairs=0,orbChecks=0,maxOrbDifferenceDegrees=0,worst=null;const classifications=[];
 for(const a of charts)for(const b of charts){
  pairs++;const actual=interAspects(a.ae,b.ae);
  for(let i=0;i<10;i++)for(let j=0;j<10;j++){
   planetPairs++;
   // Independent separation expression, unlike the engine's signed wrap formula.
   const ref=Math.acos(Math.max(-1,Math.min(1,Math.cos((a.swiss[i]-b.swiss[j])*Math.PI/180))))*180/Math.PI;
   const raw=Math.abs(a.ae[i].longitude-b.ae[j].longitude),sep=raw>180?360-raw:raw;
   for(const rule of aspectRules){
    orbChecks++;const referenceOrb=Math.abs(ref-rule.angle),actualOrb=Math.abs(sep-rule.angle),error=Math.abs(referenceOrb-actualOrb);
    if(error>maxOrbDifferenceDegrees){maxOrbDifferenceDegrees=error;worst={first:a.utc,second:b.utc,body1:bodies[i],body2:bodies[j],type:rule.id,actualOrb,referenceOrb,errorDegrees:error};}
    assert.ok(error<=2/60,'orb error exceeds 2 arcminutes');
    const included=actual.some(x=>x.first===bodies[i]&&x.second===bodies[j]&&x.type===rule.id),expected=referenceOrb<=rule.orb+1e-10;
    if(included!==expected){assert.ok(Math.abs(actualOrb-rule.orb)<=2/60,'unflagged classification mismatch');classifications.push({first:a.utc,second:b.utc,firstBody:bodies[i],secondBody:bodies[j],type:rule.id,actualOrb,referenceOrb,included,expected});}
   }
  }
 }
 const result={status:'passed-experimental-sample-only',startedAt,finishedAt:new Date().toISOString(),swiss:Swiss.version(),flags:258,pairs,planetPairs,orbChecks,limitDegrees:2/60,maxOrbDifferenceDegrees,worst,classificationDifferences:classifications,policy:'Default AE Delta T vs default Swiss Delta T; same UTC-like UT1, DUT1=0. Near-cutoff classifications can differ and must not imply guaranteed physical precision.'};
 writeFileSync(new URL('./synastry-reference-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({...result,classificationDifferences:classifications.length}));
});
