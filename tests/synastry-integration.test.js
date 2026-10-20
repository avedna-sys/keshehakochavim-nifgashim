import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHistoricalTimeResolver} from '../research/astronomy-engine/historical-time.mjs';
import {createIntegratedSynastry} from '../src/synastry-integration.js';
import {prepareRequest} from '../src/synastry.js';
import {calculateNatal} from '../research/astronomy-engine/engine.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../research/astronomy-engine/data/tzdb-2026b.json',import.meta.url))));
const first={name:'ראשון',date:'1930-01-01',time:'12:00',place:'אמסטרדם',country:'הולנד'},second={name:'שני',date:'1990-05-17',time:'09:30',place:'ירושלים',country:'ישראל'};
const locations=[{id:'test-amsterdam',name:'אמסטרדם',countryCode:'NL',latitude:52.3676,longitude:4.9041,timeZone:'Europe/Amsterdam',source:'explicit test fixture'},{id:'test-jerusalem',name:'ירושלים',countryCode:'IL',latitude:31.7683,longitude:35.2137,timeZone:'Asia/Jerusalem',source:'explicit test fixture'}];
test('existing form integration uses full TZDB and identical engine values, including Amsterdam seconds',()=>{
 const pair=createIntegratedSynastry(prepareRequest(first,second,'זוגיות'),locations,resolver,{includeMeanNodes:true,includeMeanLilith:true});
 assert.equal(pair.relationship,'זוגיות');assert.equal(pair.charts[0].utc,'1930-01-01T11:40:28Z');assert.equal(pair.charts[0].offsetSeconds,1172);
 const direct=calculateNatal({utc:pair.charts[0].utc,latitude:locations[0].latitude,longitude:locations[0].longitude});assert.deepEqual(pair.charts[0].planets,direct.planets);assert.deepEqual(pair.charts[0].houses,direct.houses);assert.equal(pair.charts[0].points.length,13);
});
test('no selected city, wrong country or unknown time cannot create an integrated chart',()=>{
 const request=prepareRequest(first,second,'זוגיות');assert.throws(()=>createIntegratedSynastry(request,[null,locations[1]],resolver),/לבחור עיר/);
 assert.throws(()=>createIntegratedSynastry(request,[{...locations[0],countryCode:'IL'},locations[1]],resolver),/אינה תואמת/);
 assert.throws(()=>createIntegratedSynastry(prepareRequest({...first,time:''},second,'זוגיות'),locations,resolver),/שעת לידה ידועה/);
});
test('folds, gaps and polar locations cannot bypass the verified guards',()=>{
 const loc=[{...locations[0],timeZone:'America/New_York'},locations[1]];
 assert.throws(()=>createIntegratedSynastry(prepareRequest({...first,date:'2024-11-03',time:'01:30'},second,'זוגיות'),loc,resolver),/פעמיים/);
 assert.throws(()=>createIntegratedSynastry(prepareRequest({...first,date:'2024-03-10',time:'02:30'},second,'זוגיות'),loc,resolver),/אינה קיימת/);
 assert.throws(()=>createIntegratedSynastry(prepareRequest(first,second,'זוגיות'),[{...locations[0],latitude:70},locations[1]],resolver),/Placidus/);
});
