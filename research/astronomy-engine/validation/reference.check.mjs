import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Swiss from 'sweph';
import * as Astronomy from 'astronomy-engine';
import {calculateNatal,bodies} from '../engine.mjs';
import {calculatePlacidus,signedDifference} from '../placidus.mjs';
const hashes={'sepl_12.se1':'8dccace2557601a223d5f8a7cf64de4e6bbb8a82b9b130b95a54d49adfbe546d',
 'semo_12.se1':'1c65fdbb854f350d3de36afc3e4ac126a53f360ae4f6dcb57beed7c690e7eb61',
 'sepl_18.se1':'ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66','semo_18.se1':'1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7'};
const refDir=fileURLToPath(new URL('./reference-data/',import.meta.url));
const sites=[['Amsterdam',52.3676,4.9041],['Jerusalem',31.7683,35.2137],['Paris',48.8566,2.3522],['Kathmandu',27.7172,85.324],['New York',40.7128,-74.006],['Lord Howe',-31.55,159.08],['Apia',-13.833,-171.75],['London',51.5074,-0.1278],['Equator',0,0],['Sydney',-33.8688,151.2093],['Reykjavik',64.1466,-21.9426],['Near polar south',-65,0]];
const dates=[];
for(let y=1800;y<=2026;y++)for(let m=1;m<=12;m++)dates.push(`${y}-${String(m).padStart(2,'0')}-15T12:34:56Z`);
dates.push('1800-01-01T00:00:00Z','1930-01-01T11:40:28Z','2000-01-01T12:00:00Z','2026-12-31T23:59:59Z');
function metric(){return {count:0,sum:0,maxDegrees:0,worst:null};}
function add(m,error,details){assert.ok(Number.isFinite(error));m.count++;m.sum+=error;if(error>m.maxDegrees){m.maxDegrees=error;m.worst={...details,errorDegrees:error};}}
function finish(m){m.meanDegrees=m.sum/m.count;delete m.sum;}
function skyDistance(a,b){const r=Math.PI/180;const dl=signedDifference(a.longitude,b[0])*r,db=(a.latitude-b[1])*r;return 2*Math.asin(Math.sqrt(Math.min(1,Math.sin(db/2)**2+Math.cos(a.latitude*r)*Math.cos(b[1]*r)*Math.sin(dl/2)**2)))/r;}
test('fresh Swiss file-backed reference comparison, 1800–2026',()=>{
 const started=new Date().toISOString();
 for(const [file,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(refDir+file)).digest('hex'),hash,'Run npm run reference:prepare; reference data missing/corrupt');
 Swiss.set_ephe_path(refDir);
 const flags=Swiss.constants.SEFLG_SWIEPH|Swiss.constants.SEFLG_SPEED;
 assert.equal(flags,258);
 const modes={};for(const mode of ['default','matchedDeltaT'])modes[mode]={planets:Object.fromEntries(bodies.map(b=>[b,{longitude:metric(),skySeparation:metric()}])),houses:metric(),cuspMetrics:Array.from({length:12},metric),asc:metric(),mc:metric(),dsc:metric(),ic:metric(),houseCharts:0};
 const samples=[],houseSamples=[];let referenceCalls=0;const violations=[];
 for(let index=0;index<dates.length;index++){
  const utc=dates[index],jd=Date.parse(utc)/86400000+2440587.5;
  const dt=Swiss.deltat_ex(jd,Swiss.constants.SEFLG_SWIEPH);assert.equal(dt.error,'');
  const references=bodies.map((body,id)=>{const v=Swiss.calc_ut(jd,id,flags);assert.equal(v.flag,flags,`${body} ${utc}: fallback prohibited`);assert.equal(v.error,'');referenceCalls++;return v.data;});
  for(const [mode,stats] of Object.entries(modes)){
   const chart=calculateNatal({utc,latitude:31.7683,longitude:35.2137,...(mode==='matchedDeltaT'?{deltaTSeconds:dt.data*86400}:{})});
   for(let i=0;i<bodies.length;i++){
    const p=chart.planets[i],v=references[i],error=Math.abs(signedDifference(p.longitude,v[0]));
    const details={utc,actual:p.longitude,reference:v[0]};
    add(stats.planets[p.body].longitude,error,details);add(stats.planets[p.body].skySeparation,skyDistance(p,v),details);
    if(error>1/60||skyDistance(p,v)>1/60)violations.push({mode,body:p.body,...details,error});
    if(['1930-01-01T11:40:28Z','2000-01-01T12:00:00Z'].includes(utc))samples.push({mode,utc,body:p.body,actual:p.longitude,reference:v[0],differenceDegrees:signedDifference(p.longitude,v[0])});
   }
   // Every quarterly date plus boundary/reference examples, across both hemispheres.
   if(index%3!==0&&index<2724)continue;
   const time=new Astronomy.AstroTime(jd-2451545);time.tt=chart.metadata.ttJulianDay-2451545;
   for(const [site,latitude,longitude] of sites){
    const h=calculatePlacidus(time,latitude,longitude),r=Swiss.houses_ex(jd,0,latitude,longitude,'P');assert.equal(r.flag,0);
    stats.houseCharts++;
    for(let i=0;i<12;i++){
     const error=Math.abs(signedDifference(h.cusps[i],r.data.houses[i]));
     const details={utc,site,house:i+1,actual:h.cusps[i],reference:r.data.houses[i]};add(stats.houses,error,details);add(stats.cuspMetrics[i],error,details);
     if((utc==='1930-01-01T11:40:28Z'&&site==='Amsterdam')||(utc==='2000-01-01T12:00:00Z'&&site==='Jerusalem'))houseSamples.push({mode,...details,differenceDegrees:signedDifference(h.cusps[i],r.data.houses[i])});
     if(mode==='matchedDeltaT'&&error>0.005)violations.push({mode,...details,error});
    }
    for(const [axis,ref] of Object.entries({asc:r.data.points[0],mc:r.data.points[1],dsc:(r.data.points[0]+180)%360,ic:(r.data.points[1]+180)%360}))add(stats[axis],Math.abs(signedDifference(h[axis],ref)),{utc,site,actual:h[axis],reference:ref});
   }
  }
 }
 const sourceFiles=[Swiss.get_current_file_data(0),Swiss.get_current_file_data(1)];
 for(const f of sourceFiles){assert.equal(f.denum,441);assert.ok(f.path.startsWith(refDir));}
 for(const stats of Object.values(modes)){for(const p of Object.values(stats.planets)){finish(p.longitude);finish(p.skySeparation);}for(const cusp of stats.cuspMetrics)finish(cusp);for(const key of ['houses','asc','mc','dsc','ic'])finish(stats[key]);}
 const result={status:violations.length?'failed':'passed-experimental-sample-only',startedAt:started,finishedAt:new Date().toISOString(),node:process.version,astronomyEngine:'2.1.19',swiss:Swiss.version(),swissFlags:flags,sourceFiles,dates:dates.length,referenceCalls,sites,thresholds:{planetLongitudeDegrees:1/60,planetSkySeparationDegrees:1/60,matchedDeltaTHouseDegrees:0.005},timePolicy:'Treat each supplied UTC-like timestamp as UT1 (DUT1=0) in both engines. Default mode uses each engine Delta T; matchedDeltaT uses Swiss Delta T in AE. Not verification of historical UTC/UT1 or timezone conversion.',modes,samples,houseSamples,violations};
 writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({dates:result.dates,referenceCalls,houseChartsPerMode:modes.default.houseCharts,violations:violations.length,defaultMaxHouse:modes.default.houses.maxDegrees,matchedMaxHouse:modes.matchedDeltaT.houses.maxDegrees}));
 assert.equal(violations.length,0,'See newly generated validation/results.json');
});
