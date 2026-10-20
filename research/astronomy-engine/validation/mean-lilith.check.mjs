import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as A from 'astronomy-engine';
import S from 'sweph';
import {calculateMeanBlackMoonLilith} from '../verified/mean-lilith.mjs';
import {signedDifference} from '../placidus.mjs';
// Acceptance gates declared BEFORE the first comparison run. Never fitted to Swiss.
const limitDegrees=0.001;
const examples=['1800-01-01T00:00:00Z','1850-06-15T12:34:56Z','1900-01-01T12:00:00Z','1930-01-01T11:40:28Z','1950-06-15T12:34:56Z','2000-01-01T12:00:00Z','2016-11-15T12:34:56Z','2024-04-08T18:00:00Z','2026-12-31T23:59:59Z'];
const dates=new Set(examples);
let dailyCount=0,monthlyExtras=0;
for(let t=Date.UTC(1800,0,1,12,34,56);t<Date.UTC(2027,0,1);t+=86400000){dates.add(new Date(t).toISOString().replace('.000Z','Z'));dailyCount++;}
for(let y=1800;y<=2026;y++)for(let m=1;m<=12;m++)for(const clock of ['00:00:00','23:59:59']){dates.add(`${y}-${String(m).padStart(2,'0')}-01T${clock}Z`);monthlyExtras++;}
test('mean Lilith is explicitly mean apogee with finite normalized projected coordinates',()=>{
 const p=calculateMeanBlackMoonLilith(A.MakeTime(new Date('2000-01-01T12:00:00Z')));
 assert.equal(p.point,'MeanBlackMoonLilith');assert.equal(p.method,'mean-lunar-apogee');
 assert.ok(p.longitude>=0&&p.longitude<360);assert.ok(Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=5.1454);
 assert.ok(Math.abs(signedDifference(p.longitude,263.3532465))>0.05,'projected ecliptic longitude differs from unprojected element');
 assert.equal('osculating' in p,false);assert.equal('asteroid' in p,false);assert.equal('distanceAU' in p,false,'no invented radius');
});
test('invalid or unsupported TT input is rejected',()=>{
 for(const t of [null,{},new Date(),A.MakeTime(new Date('1600-01-01T00:00:00Z')),A.MakeTime(new Date('2300-01-01T00:00:00Z'))])assert.throws(()=>calculateMeanBlackMoonLilith(t),RangeError);
});
function metric(){return {count:0,sum:0,squares:0,maxDegrees:0,worst:null,failed:0};}
function record(m,error,row){assert.ok(Number.isFinite(error));m.count++;m.sum+=error;m.squares+=error*error;if(error>m.maxDegrees){m.maxDegrees=error;m.worst=row;}if(error>limitDegrees)m.failed++;}
function finish(m){m.meanDegrees=m.sum/m.count;m.rmsDegrees=Math.sqrt(m.squares/m.count);m.passed=m.count-m.failed;delete m.sum;delete m.squares;}
function separation(actual,ref){const rad=Math.PI/180,dl=signedDifference(actual.longitude,ref[0])*rad,db=(actual.latitude-ref[1])*rad;return 2*Math.asin(Math.sqrt(Math.min(1,Math.sin(db/2)**2+Math.cos(actual.latitude*rad)*Math.cos(ref[1]*rad)*Math.sin(dl/2)**2)))/rad;}
test('fresh Mean Black Moon Lilith vs Swiss MEAN_APOG, every day 1800–2026 plus subday samples',()=>{
 const startedAt=new Date().toISOString(),provenance=JSON.parse(readFileSync(new URL('./reference-provenance.json',import.meta.url))),directory=fileURLToPath(new URL('./reference-data/',import.meta.url));
 for(const [file,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(readFileSync(directory+file)).digest('hex'),hash);
 S.set_ephe_path(directory);
 assert.equal(S.constants.SE_MEAN_APOG,12);assert.notEqual(S.constants.SE_OSCU_APOG,12);assert.notEqual(S.constants.SE_AST_OFFSET+1181,12);
 const flags=258,referenceId=12,modes=Object.fromEntries(['default','matchedDeltaT'].map(mode=>[mode,{longitude:metric(),latitude:metric(),skySeparation:metric(),comparisons:0,failedComparisons:0,passedComparisons:0}]));
 const samples=[],violations=[];let referenceCalls=0,wrapCases=0;
 for(const utc of [...dates].sort()){
  const ut=Date.parse(utc)/86400000+2440587.5,ref=S.calc_ut(ut,referenceId,flags),dt=S.deltat_ex(ut,2);
  assert.equal(ref.flag,flags,'Unexpected flags/fallback');assert.equal(ref.error,'');assert.equal(dt.error,'');referenceCalls++;
  const times={default:A.MakeTime(new Date(utc)),matchedDeltaT:A.AstroTime.FromTerrestrialTime(ut-2451545+dt.data)};
  for(const [mode,time] of Object.entries(times)){
   const actual=calculateMeanBlackMoonLilith(time),longitudeDifference=signedDifference(actual.longitude,ref.data[0]),latitudeDifference=actual.latitude-ref.data[1],sky=separation(actual,ref.data);
   assert.ok(actual.longitude>=0&&actual.longitude<360&&Math.abs(actual.latitude)<=5.1454);
   const errors={longitude:Math.abs(longitudeDifference),latitude:Math.abs(latitudeDifference),skySeparation:sky};
   const row={utc,mode,actual:{longitude:actual.longitude,latitude:actual.latitude},reference:{longitude:ref.data[0],latitude:ref.data[1]},longitudeDifferenceDegrees:longitudeDifference,latitudeDifferenceDegrees:latitudeDifference,skySeparationDegrees:sky};
   const stats=modes[mode];stats.comparisons++;
   for(const [component,error] of Object.entries(errors))record(stats[component],error,row);
   if(Object.values(errors).some(error=>error>limitDegrees)){stats.failedComparisons++;if(violations.length<100)violations.push(row);}else stats.passedComparisons++;
   if(examples.includes(utc))samples.push(row);
   if(actual.longitude<1||actual.longitude>359)wrapCases++;
  }
 }
 for(const stats of Object.values(modes))for(const c of ['longitude','latitude','skySeparation'])finish(stats[c]);
 const failedComparisons=Object.values(modes).reduce((sum,s)=>sum+s.failedComparisons,0),passedComparisons=Object.values(modes).reduce((sum,s)=>sum+s.passedComparisons,0);
 const result={status:failedComparisons?'failed':'passed-mean-lilith-only-sample-validation',startedAt,finishedAt:new Date().toISOString(),node:process.version,astronomyEngine:'2.1.19',swiss:S.version(),referenceId,flags,definition:'Mean lunar apogee (Mean Black Moon Lilith); not osculating, interpolated or asteroid Lilith',provenance,limitDegrees,dates:dates.size,dailyCount,monthlyExtras,referenceCalls,positionComparisons:passedComparisons+failedComparisons,passedComparisons,failedComparisons,coordinateChecks:(passedComparisons+failedComparisons)*3,wrapCases,modes,samples,violations,violationDetailsTruncated:failedComparisons>violations.length,timePolicy:'Same UT1 timestamp, DUT1=0. Default uses each engine Delta T; matchedDeltaT uses Swiss Delta T in AE. Not verification of historic local time or UTC/UT1.'};
 writeFileSync(new URL('./mean-lilith-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({scope:result.definition,dates:dates.size,positionComparisons:result.positionComparisons,passedComparisons,failedComparisons,maxLongitude:Math.max(...Object.values(modes).map(s=>s.longitude.maxDegrees)),maxLatitude:Math.max(...Object.values(modes).map(s=>s.latitude.maxDegrees)),maxSkySeparation:Math.max(...Object.values(modes).map(s=>s.skySeparation.maxDegrees)),limitDegrees}));
 assert.equal(failedComparisons,0,'See current validation/mean-lilith-results.json');
 assert.ok(wrapCases>0,'0/360 boundary sampled');
});
