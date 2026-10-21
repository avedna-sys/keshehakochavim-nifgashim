import * as Astronomy from 'astronomy-engine';
import {normalize,signedDifference} from './placidus.mjs';
import {zodiacPosition} from './engine.mjs';
import {calculateMeanLunarNodes} from './verified/mean-node.mjs';
import {calculateMeanBlackMoonLilith} from './verified/mean-lilith.mjs';
// Central difference, ±5 TT minutes, in the SAME frame as natal positions.
// Classification is withheld within the tested 0.001 degree/day error bound.
export const motionErrorBound=0.001;
export function longitudeAt(body,time){
 if(body==='MeanNorthNode')return calculateMeanLunarNodes(time).northLongitude;
 if(body==='MeanSouthNode')return calculateMeanLunarNodes(time).southLongitude;
 if(body==='MeanLilith')return calculateMeanBlackMoonLilith(time).longitude;
 return Astronomy.Ecliptic(Astronomy.GeoVector(body,time,true)).elon;
}
export function motionAt(body,ttJulianDay){
 const step=5/1440,t=ttJulianDay-2451545;
 const speed=signedDifference(longitudeAt(body,Astronomy.AstroTime.FromTerrestrialTime(t+step)),longitudeAt(body,Astronomy.AstroTime.FromTerrestrialTime(t-step)))/(2*step);
 if(!Number.isFinite(speed))throw Error('Non-finite longitude speed');
 return {longitudeSpeed:speed,motion:body==='Saturn'?'unverified':Math.abs(speed)<=motionErrorBound?'uncertain':speed<0?'retrograde':'direct'};
}
export function zodiacParts(longitude){
 const p=zodiacPosition(longitude),minutes=Math.floor(p.degreesWithinSign*60+1e-10);
 return {...p,degree:Math.floor(minutes/60),minute:minutes%60};
}
// Ecliptic-longitude placement between own Placidus cusps, not 3-D house position.
// A cusp belongs to the house starting there; near-boundary assignment is flagged.
export function housePlacement(longitude,cusps){
 if(!Array.isArray(cusps)||cusps.length!==12||!cusps.every(Number.isFinite)||!Number.isFinite(longitude))throw RangeError('Invalid house data');
 for(let i=0;i<12;i++){
  const width=normalize(cusps[(i+1)%12]-cusps[i]),offset=normalize(longitude-cusps[i]);
  if(offset<width)return {house:i+1,nearCusp:Math.min(offset,width-offset)<=1/60};
 }
 throw Error('House placement unavailable');
}
export function pointDetails(point,chart){return {...point,...zodiacParts(point.longitude),...housePlacement(point.longitude,chart.houses.cusps),...motionAt(point.body,chart.metadata.ttJulianDay)};}
