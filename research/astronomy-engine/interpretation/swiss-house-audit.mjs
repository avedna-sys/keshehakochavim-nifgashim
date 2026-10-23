// Swiss Ephemeris is a development/reference dependency only. Never imported by the app.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import Swiss from 'sweph';
const bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const rulers=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const norm=x=>((x%360)+360)%360;
const distance=(a,b)=>Math.abs(((a-b+540)%360)-180);
function placement(l,c){for(let i=0;i<12;i++)if(norm(l-c[i])<norm(c[(i+1)%12]-c[i]))return i+1;throw Error('Invalid reference houses');}
export function compareSwissHouses(pair,people,model){
 Swiss.set_ephe_path(fileURLToPath(new URL('../validation/reference-data/',import.meta.url)));
 const references=people.map((p,i)=>{
  const chart=pair.charts[i],jd=Date.parse(chart.utc)/86400000+2440587.5;
  const h=Swiss.houses_ex(jd,0,p.latitude,p.longitude,'P');assert.equal(h.flag,0);
  const points=bodies.map((body,id)=>{
   const matched=Swiss.calc(chart.metadata.ttJulianDay,id,770),standard=Swiss.calc(chart.metadata.ttJulianDay,id,258);
   assert.equal(matched.flag,770,'No fallback from Swiss ephemeris');assert.equal(standard.flag,258);
   return{body,longitude:matched.data[0],standardLongitude:standard.data[0]};
  });
  return {cusps:h.data.houses,points};
 });
 const rows=[],signMismatches=[],rulerMismatches=[],houseMismatches=[];
 for(let i=0;i<2;i++){
  const c=pair.charts[i],r=references[i];
  c.houses.cusps.forEach((longitude,k)=>{
   const delta=distance(longitude,r.cusps[k]);assert.ok(delta<=.005,'Pre-existing 0.005 degree house threshold');
   rows.push({person:i,house:k+1,engine:longitude,swiss:r.cusps[k],differenceDegrees:delta});
   if(Math.floor(longitude/30)!==Math.floor(r.cusps[k]/30))signMismatches.push({person:i,house:k+1});
   const f=model.facts.find(f=>f.kind==='ruler'&&f.person===i&&f.house===k+1);
   // Swiss supplies cusp longitude, not an interpretive ruler policy.
   if(f.ruler!==rulers[Math.floor(r.cusps[k]/30)])rulerMismatches.push({person:i,house:k+1});
  });
  for(const p of r.points){
   const f=model.facts.find(f=>f.kind==='position'&&f.person===i&&f.body===p.body),o=model.facts.find(f=>f.kind==='overlay'&&f.person===i&&f.body===p.body);
   const own=placement(p.longitude,r.cusps),cross=placement(p.longitude,references[1-i].cusps);
   const ownStandard=placement(p.standardLongitude,r.cusps),crossStandard=placement(p.standardLongitude,references[1-i].cusps);
   if(f.ownHouse.house!==own||o.house!==cross||own!==ownStandard||cross!==crossStandard)houseMismatches.push({person:i,body:p.body,own,actualOwn:f.ownHouse.house,cross,actualCross:o.house,ownStandard,crossStandard});
  }
 }
 return {source:'Swiss Ephemeris via sweph 2.10.3-8, local reference data; freshly executed, not Solar Fire',scope:'Tropical Placidus cusp longitudes; ecliptic-longitude house membership, not swe_house_pos 3D',timePolicy:'Houses share engine UTC treated as UT1 (DUT1=0); planets share engine TT to isolate coordinate/house comparison. Not independent time-zone validation.',planetFrames:'Swiss flags 770 matched to AE without gravitational deflection; standard 258 independently checked for unchanged house membership. No fallback permitted.',rulershipPolicy:'Traditional ruler assigned independently from Swiss cusp sign; rulership is an editorial convention, not a Swiss astronomical output.',thresholdDegrees:.005,cuspsCompared:24,natalHouseChecks:20,crossHouseChecks:20,standardFrameMembershipChecks:40,maxCuspDifferenceDegrees:Math.max(...rows.map(r=>r.differenceDegrees)),signMismatches,rulerMismatches,houseMismatches,rows,status:[signMismatches,rulerMismatches,houseMismatches].every(a=>!a.length)?'passed':'failed'};
}
