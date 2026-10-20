import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateNatal,zodiacPosition,bodies} from '../engine.mjs';
import {signedDifference} from '../placidus.mjs';
const input={utc:'2000-01-01T12:00:00Z',latitude:32.0853,longitude:34.7818};
test('ten finite tropical geocentric positions, isolated experimental status',()=>{
 const chart=calculateNatal(input);
 assert.equal(chart.status,'experimental-not-for-public-use');assert.deepEqual(chart.planets.map(p=>p.body),bodies);
 for(const p of chart.planets){assert.ok(p.longitude>=0&&p.longitude<360);assert.ok(Number.isFinite(p.latitude));assert.ok(p.distanceAU>0);assert.equal(p.signIndex,Math.floor(p.longitude/30));}
});
test('zodiac boundaries and wrapped differences',()=>{
 assert.equal(zodiacPosition(360).sign,'טלה');assert.equal(zodiacPosition(-1).degreesWithinSign,29);assert.equal(zodiacPosition(30).sign,'שור');
 assert.equal(signedDifference(0.1,359.9).toFixed(1),'0.2');assert.throws(()=>zodiacPosition(NaN));
});
test('no guessed birth times, invalid dates or coordinates',()=>{
 for(const patch of [{utc:undefined},{utc:'2000-02-30T12:00:00Z'},{utc:'2000-01-01T24:00:00Z'},{utc:'1799-12-31T12:00:00Z'},{utc:'2027-01-01T00:00:00Z'},{utc:'2000-01-01T12:00:00+02:00'},{latitude:NaN},{longitude:181},{latitude:91},{deltaTSeconds:NaN},{dut1Seconds:Infinity}])assert.throws(()=>calculateNatal({...input,...patch}),RangeError);
});
test('Placidus preserves opposing axes/cusps and finite order',()=>{
 for(const latitude of [-65,-33,0,32,65]){
  const h=calculateNatal({...input,latitude}).houses;
  assert.equal(h.cusps.length,12);
  for(let i=0;i<6;i++)assert.ok(Math.abs(Math.abs(signedDifference(h.cusps[i],h.cusps[i+6]))-180)<1e-8);
  assert.equal(h.cusps[0],h.asc);assert.equal(h.cusps[9],h.mc);assert.equal(h.cusps[3],h.ic);assert.equal(h.cusps[6],h.dsc);
 }
});
test('polar houses rejected without changing the house system',()=>{
 for(const latitude of [69.65,78.22,-70])assert.throws(()=>calculateNatal({...input,latitude}),/Placidus/);
});
test('explicit TT and UT1 inputs remain visible and independent charts do not share state',()=>{
 const before=calculateNatal(input),other=calculateNatal({...input,utc:'1930-01-01T11:40:28Z',latitude:52.37,longitude:4.9,deltaTSeconds:24,dut1Seconds:0.1});
 assert.ok(Math.abs(other.metadata.deltaTSeconds-24)<1e-5);assert.equal(other.metadata.dut1Seconds,0.1);
 assert.deepEqual(calculateNatal(input),before);assert.notDeepEqual(other.planets,before.planets);
 // Historical Delta T can be negative.
 assert.ok(Number.isFinite(calculateNatal({...input,deltaTSeconds:-3}).planets[0].longitude));
});
