// Reference-only diagnostic: Swiss state vectors must never feed the MIT runtime.
import * as A from 'astronomy-engine';
import S from 'sweph';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {normalize,signedDifference} from '../placidus.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const failures=['2016-04-29T06:17:23Z','2016-11-15T06:17:23Z','2016-11-15T12:34:56Z'];
S.set_ephe_path(fileURLToPath(new URL('./reference-data/',import.meta.url)));
const provenance=JSON.parse(readFileSync(new URL('./reference-provenance.json',import.meta.url)));
for(const [file,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(readFileSync(new URL('./reference-data/'+file,import.meta.url))).digest('hex'),hash);
const c=S.constants,flags=c.SEFLG_SWIEPH|c.SEFLG_SPEED;
const stateFlags=flags|c.SEFLG_XYZ|c.SEFLG_EQUATORIAL|c.SEFLG_J2000|c.SEFLG_NONUT|c.SEFLG_TRUEPOS;
function checked(tt,id,f){const v=S.calc(tt,id,f);if(v.error||(v.flag&f)!==f||(v.flag&7)!==c.SEFLG_SWIEPH)throw Error(JSON.stringify(v));return v.data;}
function node(s,t){const v=A.RotateState(A.Rotation_EQJ_ECT(t),s);return normalize(Math.atan2(v.y*v.vz-v.z*v.vy,-(v.z*v.vx-v.x*v.vz))*180/Math.PI);}
function hybrid(r,v,t){return new A.StateVector(r.x,r.y,r.z,v.vx,v.vy,v.vz,t);}
function fourth(t,h=.001){const r=A.GeoMoon(t),p=[-2,-1,1,2].map(i=>A.GeoMoon(A.AstroTime.FromTerrestrialTime(t.tt+i*h)));const v=['x','y','z'].map(k=>(p[0][k]-8*p[1][k]+8*p[2][k]-p[3][k])/(12*h));return new A.StateVector(r.x,r.y,r.z,...v,t);}
const rows=[];
for(const utc of failures){
 const ut=Date.parse(utc)/86400000+2440587.5,deltaT=S.deltat_ex(ut,c.SEFLG_SWIEPH).data,tt=ut+deltaT,time=A.AstroTime.FromTerrestrialTime(tt-2451545);
 const raw=checked(tt,1,stateFlags),swiss=new A.StateVector(...raw,time),ae=A.GeoMoonState(time);
 const apparent=checked(tt,11,flags)[0],geometric=checked(tt,11,flags|c.SEFLG_TRUEPOS)[0];
 const standard=node(ae,time),defaultTime=A.MakeTime(new Date(utc));
 const defaultNode=node(A.GeoMoonState(defaultTime),defaultTime);
 const utResult=S.calc_ut(ut,11,flags);assert.equal(utResult.flag,flags);assert.equal(utResult.error,'');
 const utVsTtDifferenceDegrees=signedDifference(utResult.data[0],apparent);
 const rowsByMethod={ae,swiss,swissPosition_aeVelocity:hybrid(swiss,ae,time),aePosition_swissVelocity:hybrid(ae,swiss,time),aeFourthOrder:fourth(time)};
 const nodes=Object.fromEntries(Object.entries(rowsByMethod).map(([method,state])=>[method,{longitude:node(state,time),differenceFromSwissGeometric:signedDifference(node(state,time),geometric)}]));
 const velocityNorm=v=>Math.hypot(v.vx,v.vy,v.vz);
 const posDiffKm=Math.hypot(ae.x-swiss.x,ae.y-swiss.y,ae.z-swiss.z)*149597870.7;
 const velDiffMetersPerSecond=Math.hypot(ae.vx-swiss.vx,ae.vy-swiss.vy,ae.vz-swiss.vz)*149597870700/86400;
 const velocityDirectionDifferenceDegrees=Math.acos(Math.max(-1,Math.min(1,(ae.vx*swiss.vx+ae.vy*swiss.vy+ae.vz*swiss.vz)/(velocityNorm(ae)*velocityNorm(swiss)))))*180/Math.PI;
 rows.push({utc,utJulianDay:ut,ttJulianDay:tt,deltaTSeconds:deltaT*86400,defaultDeltaTSeconds:(defaultTime.tt-defaultTime.ut)*86400,defaultNode,standardNode:standard,swissApparent:apparent,swissGeometric:geometric,timeScaleEffectDegrees:signedDifference(defaultNode,standard),lightTimeEffectDegrees:signedDifference(apparent,geometric),utVsTtDifferenceDegrees,positionDifferenceKm:posDiffKm,velocityDifferenceMetersPerSecond:velDiffMetersPerSecond,velocityDirectionDifferenceDegrees,nodes});
}
for(const row of rows){
 assert.ok(Math.abs(row.utVsTtDifferenceDegrees)<1e-8);
 assert.ok(Math.abs(row.timeScaleEffectDegrees)<0.00001);
 assert.ok(Math.abs(row.lightTimeEffectDegrees)<0.00001);
 assert.ok(Math.abs(row.nodes.swiss.differenceFromSwissGeometric)<0.00005);
 assert.ok(Math.abs(row.nodes.ae.differenceFromSwissGeometric)>0.005);
 assert.ok(Math.abs(row.nodes.aeFourthOrder.longitude-row.nodes.ae.longitude)<0.000001);
}
const result={checks:'passed for the three failure instants',provenance,generatedAt:new Date().toISOString(),swissVersion:S.version(),flags,stateFlags,status:'diagnostic-only-no-swiss-state-in-runtime',rows};
writeFileSync(new URL('./node-cause-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
