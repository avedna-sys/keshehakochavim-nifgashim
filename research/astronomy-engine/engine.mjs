import * as Astronomy from 'astronomy-engine';
import {calculatePlacidus,normalize} from './placidus.mjs';
export const bodies=Object.freeze(['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']);
const signs=['טלה','שור','תאומים','סרטן','אריה','בתולה','מאזניים','עקרב','קשת','גדי','דלי','דגים'];
export function zodiacPosition(longitude){
 if(!Number.isFinite(longitude))throw RangeError('Invalid longitude');
 const value=normalize(longitude),signIndex=Math.floor(value/30);
 return {longitude:value,signIndex,sign:signs[signIndex],degreesWithinSign:value-signIndex*30};
}
/** Isolated numeric core. Already-resolved UTC only, never local civil time.
 * Default DUT1=0 is an assumption. Historical time scales need a separate policy. */
export function calculateNatal({utc,latitude,longitude,dut1Seconds=0,deltaTSeconds}={}){
 if(typeof utc!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(utc))throw RangeError('Known UTC time with seconds required');
 const date=new Date(utc);
 if(!Number.isFinite(date.getTime())||date.toISOString().replace('.000Z','Z')!==utc||date.getUTCFullYear()<1800||date.getUTCFullYear()>2026)throw RangeError('Supported Gregorian range: 1800–2026');
 if(!Number.isFinite(dut1Seconds)||Math.abs(dut1Seconds)>120)throw RangeError('Invalid DUT1');
 if(deltaTSeconds!==undefined&&(!Number.isFinite(deltaTSeconds)||deltaTSeconds < -1000||deltaTSeconds>10000))throw RangeError('Invalid Delta T');
 const utDays=(date.getTime()/86400000-10957.5)+dut1Seconds/86400;
 const defaultTime=new Astronomy.AstroTime(utDays);
 const ttDays=deltaTSeconds===undefined?defaultTime.tt:utDays+deltaTSeconds/86400;
 // GeoVector light-time AddDays must remain consistent with the chosen TT.
 const planetTime=Astronomy.AstroTime.FromTerrestrialTime(ttDays);
 const angleTime=new Astronomy.AstroTime(utDays);angleTime.tt=ttDays;
 const houses=calculatePlacidus(angleTime,latitude,longitude);
 const planets=bodies.map(body=>{
  const pos=Astronomy.Ecliptic(Astronomy.GeoVector(body,planetTime,true));
  return {body,...zodiacPosition(pos.elon),latitude:pos.elat,distanceAU:Math.hypot(pos.vec.x,pos.vec.y,pos.vec.z)};
 });
 return {status:'experimental-not-for-public-use',utc,latitude,longitude,planets,houses,metadata:{engine:'Astronomy Engine 2.1.19',zodiac:'tropical',frame:'geocentric apparent ecliptic/equinox of date',ut1JulianDay:2451545+utDays,ttJulianDay:2451545+ttDays,dut1Seconds,deltaTSeconds:(ttDays-utDays)*86400,deltaTSource:deltaTSeconds===undefined?'Astronomy Engine default Espenak–Meeus':'explicit input',warning:'Historical timezone conversion not included; no automatic local-time inference.'}};
}
