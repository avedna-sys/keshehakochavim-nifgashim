import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {calculateNatal} from '../engine.mjs';
import {calculateExperimentalSynastry,interAspects,aspectRules} from '../synastry.mjs';
import {position,pointLabels} from '../browser/chart.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
const first={name:'ראשון',date:'1930-01-01',time:'12:00',latitude:52.3676,longitude:4.9041,timeZone:'Europe/Amsterdam'},second={name:'שני',date:'2000-01-01',time:'12:00',latitude:31.7683,longitude:35.2137,timeZone:'Asia/Jerusalem'};
test('browser pair uses full-history Amsterdam UTC and identical verified natal positions/houses',()=>{
 const pair=calculateExperimentalSynastry(first,second,resolver),ref=calculateNatal({utc:'1930-01-01T11:40:28Z',latitude:first.latitude,longitude:first.longitude});
 assert.equal(pair.charts[0].utc,ref.utc);assert.equal(pair.charts[0].offsetSeconds,1172);
 assert.deepEqual(pair.charts[0].planets,ref.planets);assert.deepEqual(pair.charts[0].houses,ref.houses);
 assert.equal(pair.charts[0].points.length,10);assert.equal(pair.status,'experimental-not-for-public-use');
 const extended=calculateExperimentalSynastry(first,second,resolver,{includeMeanNodes:true,includeMeanLilith:true});
 assert.equal(extended.charts[0].points.length,13);assert.deepEqual(extended.charts[0].planets,ref.planets);
 assert.ok(!extended.charts[0].points.some(p=>['Chiron','TrueNode','OsculatingLilith'].includes(p.body)));
});
test('ambiguous/nonexistent times, unknown zones and polar houses do not produce a pair',()=>{
 for(const p of [{...first,date:'2024-11-03',time:'01:30',timeZone:'America/New_York'},{...first,date:'2024-03-10',time:'02:30',timeZone:'America/New_York'},{...first,timeZone:'Bad/Zone'},{...first,latitude:70},{...first,time:''}])assert.throws(()=>calculateExperimentalSynastry(p,second,resolver));
});
test('each major inter-person aspect, exact orbs, wrap and orb limits',()=>{
 for(const rule of aspectRules){
  const results=interAspects([{body:'Sun',longitude:0}],[{body:'Moon',longitude:rule.angle}]);
  assert.equal(results.length,1);assert.equal(results[0].type,rule.id);assert.equal(results[0].orb,0);
  const target=rule.angle===180?180-rule.orb:rule.angle+rule.orb;
  assert.equal(interAspects([{body:'Sun',longitude:0}],[{body:'Moon',longitude:target}])[0].type,rule.id);
  const outside=rule.angle===180?target-.001:target+.001;
  assert.equal(interAspects([{body:'Sun',longitude:0}],[{body:'Moon',longitude:outside}]).length,0);
 }
 const wrapped=interAspects([{body:'Sun',longitude:359.9}],[{body:'Moon',longitude:.1}]);
 assert.ok(Math.abs(wrapped[0].orb-.2)<1e-10);assert.equal(wrapped[0].type,'conjunction');
 assert.throws(()=>interAspects([{body:'Sun',longitude:NaN}],[{body:'Moon',longitude:0}]));
});
test('SVG orientation and geometry preserve actual longitude, dense labels preserve source positions',()=>{
 const asc=123.456,left=position(asc,100,asc);assert.ok(Math.abs(left.x-400)<1e-10);assert.ok(Math.abs(left.y-500)<1e-10);
 const top=position(asc-90,100,asc);assert.ok(Math.abs(top.x-500)<1e-10);assert.ok(Math.abs(top.y-400)<1e-10);
 const points=[{longitude:.1},{longitude:359.9},{longitude:1},{longitude:100}],before=JSON.stringify(points),labels=pointLabels(points);
 assert.notEqual(labels.get(0),labels.get(1));assert.notEqual(labels.get(0),labels.get(2));
 const packed=pointLabels(Array.from({length:13},()=>({longitude:0})));
 const angles=[...packed.values()].sort((a,b)=>a-b);
 for(let i=0;i<angles.length;i++)assert.ok(((angles[(i+1)%angles.length]-angles[i]+360)%360)>=7.999999);assert.equal(JSON.stringify(points),before);
});
