import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as A from 'astronomy-engine';
import S from 'sweph';
import {calculateMeanLunarNodes} from '../verified/mean-node.mjs';
import {signedDifference,normalize} from '../placidus.mjs';
const examples=['1800-01-01T00:00:00Z','1850-06-15T12:34:56Z','1900-01-01T12:00:00Z','1930-01-01T11:40:28Z','1950-06-15T12:34:56Z','2000-01-01T12:00:00Z','2016-11-15T12:34:56Z','2024-04-08T18:00:00Z','2026-12-31T23:59:59Z'];
const dates=new Set(examples),dailyYears=[1800,1850,1900,1930,1950,2000,2016,2024,2026];
for(let y=1800;y<=2026;y++)for(let m=1;m<=12;m++)dates.add(`${y}-${String(m).padStart(2,'0')}-15T12:34:56Z`);
for(const y of dailyYears)for(let t=Date.UTC(y,0,1,6,17,23);new Date(t).getUTCFullYear()===y;t+=86400000)dates.add(new Date(t).toISOString().replace('.000Z','Z'));
test('standalone verified mean module exposes no true node and rejects invalid time',()=>{
 const n=calculateMeanLunarNodes(A.MakeTime(new Date('2000-01-01T12:00:00Z')));
 assert.equal(n.method,'mean');assert.equal(Object.hasOwn(n,'true'),false);
 assert.throws(()=>calculateMeanLunarNodes(null),RangeError);
 assert.throws(()=>calculateMeanLunarNodes(A.MakeTime(new Date('1600-01-01T00:00:00Z'))),RangeError);
});
test('standalone Mean Node reference validation 1800–2026, north and south, two time modes',()=>{
 const startedAt=new Date().toISOString(),provenance=JSON.parse(readFileSync(new URL('./reference-provenance.json',import.meta.url)));
 const directory=fileURLToPath(new URL('./reference-data/',import.meta.url));
 for(const [file,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(readFileSync(directory+file)).digest('hex'),hash);
 S.set_ephe_path(directory);
 const flags=258,limitDegrees=.001,samples=[],violations=[];
 const modes=Object.fromEntries(['default','matchedDeltaT'].map(mode=>[mode,{north:{sum:0,count:0,maxDegrees:0,worst:null},south:{sum:0,count:0,maxDegrees:0,worst:null}}]));
 let oppositionChecks=0;
 for(const utc of [...dates].sort()){
  const ut=Date.parse(utc)/86400000+2440587.5,ref=S.calc_ut(ut,10,flags),dt=S.deltat_ex(ut,2);
  assert.equal(ref.flag,flags);assert.equal(ref.error,'');assert.equal(dt.error,'');
  const defaultTime=A.MakeTime(new Date(utc));
  const times={default:defaultTime,matchedDeltaT:A.AstroTime.FromTerrestrialTime(ut-2451545+dt.data)};
  for(const [mode,time] of Object.entries(times)){
   const n=calculateMeanLunarNodes(time);
   assert.ok(Math.abs(Math.abs(signedDifference(n.southLongitude,n.northLongitude))-180)<1e-10);oppositionChecks++;
   for(const pole of ['north','south']){
    const actual=n[pole+'Longitude'],reference=normalize(ref.data[0]+(pole==='south'?180:0)),differenceDegrees=signedDifference(actual,reference),error=Math.abs(differenceDegrees),m=modes[mode][pole];
    assert.ok(Number.isFinite(actual)&&actual>=0&&actual<360);
    const row={utc,mode,pole,actual,reference,differenceDegrees};
    m.count++;m.sum+=error;if(error>m.maxDegrees){m.maxDegrees=error;m.worst=row;}
    if(error>limitDegrees)violations.push(row);
    if(examples.includes(utc))samples.push(row);
   }
  }
 }
 for(const poles of Object.values(modes))for(const m of Object.values(poles)){m.meanDegrees=m.sum/m.count;delete m.sum;}
 const result={status:violations.length?'failed':'passed-mean-only-sample-validation',startedAt,finishedAt:new Date().toISOString(),swiss:S.version(),astronomyEngine:'2.1.19',node:process.version,provenance,limitDegrees,dates:dates.size,dailyYears,referenceCalls:dates.size,oppositionChecks,modes,samples,violations,timePolicy:'Same UT1, DUT1=0. Default uses each engine Delta T; matchedDeltaT supplies Swiss Delta T to AE. Not a historical civil-time validation.',southPolicy:'north+180; comparison against Swiss north+180, not independent south-node ephemeris'};
 writeFileSync(new URL('./mean-node-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({scope:'verified Mean Node only',dates:dates.size,oppositionChecks,modes,violations:violations.length}));
 assert.equal(violations.length,0);
});
