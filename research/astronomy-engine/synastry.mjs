import * as Astronomy from 'astronomy-engine';
import {calculateNatal,zodiacPosition} from './engine.mjs';
import {normalize,signedDifference} from './placidus.mjs';
import {calculateMeanLunarNodes} from './verified/mean-node.mjs';
import {calculateMeanBlackMoonLilith} from './verified/mean-lilith.mjs';
export const aspectRules=Object.freeze([
 Object.freeze({id:'conjunction',label:'צמידות',symbol:'☌',angle:0,orb:8,color:'#98701a'}),
 Object.freeze({id:'opposition',label:'מולות',symbol:'☍',angle:180,orb:8,color:'#b34b63'}),
 Object.freeze({id:'square',label:'ריבוע',symbol:'□',angle:90,orb:6,color:'#bf6844'}),
 Object.freeze({id:'trine',label:'משולש',symbol:'△',angle:120,orb:6,color:'#367bb0'}),
 Object.freeze({id:'sextile',label:'משושה',symbol:'⚹',angle:60,orb:4,color:'#3f8c7b'}),
]);
export const pointInfo={Sun:['שמש','☉'],Moon:['ירח','☽'],Mercury:['מרקורי','☿'],Venus:['ונוס','♀'],Mars:['מאדים','♂'],Jupiter:['יופיטר','♃'],Saturn:['שבתאי','♄'],Uranus:['אורנוס','♅'],Neptune:['נפטון','♆'],Pluto:['פלוטו','♇'],MeanNorthNode:['ראש דרקון ממוצע','☊'],MeanSouthNode:['זנב דרקון ממוצע','☋'],MeanLilith:['לילית ממוצעת','⚸']};
export function interAspects(first,second){
 const result=[];
 for(const a of first)for(const b of second){
  if(!Number.isFinite(a.longitude)||!Number.isFinite(b.longitude))throw RangeError('Invalid longitude');
  const separation=Math.abs(signedDifference(a.longitude,b.longitude));
  for(const rule of aspectRules){
   const orb=Math.abs(separation-rule.angle);
   if(orb<=rule.orb+1e-12)result.push({id:`aspect-${result.length}`,first:a.body,second:b.body,firstLongitude:normalize(a.longitude),secondLongitude:normalize(b.longitude),type:rule.id,label:rule.label,symbol:rule.symbol,color:rule.color,angle:rule.angle,separation,orb,limit:rule.orb,nearBoundary:Math.abs(orb-rule.orb)<=2/60});
  }
 }
 return result.sort((a,b)=>a.orb-b.orb||a.id.localeCompare(b.id));
}
function chart(person,resolver,options){
 const name=person.name?.trim();if(!name)throw new Error('יש למלא שם עבור שני האנשים.');
 // This is the already-verified full IANA resolver; no browser Intl fallback.
 const local=resolver.resolve(person.date,person.time,person.timeZone);
 if(local.status==='ambiguous')throw new Error(`${name}: השעה המקומית כפולה. יש לברר את רישום הלידה; לא נבחר UTC באופן אוטומטי.`);
 if(local.status==='nonexistent')throw new Error(`${name}: השעה המקומית אינה קיימת עקב שינוי שעון. יש לברר את רישום הלידה.`);
 const resolved=local.candidates[0];
 if(!Number.isFinite(person.latitude)||!Number.isFinite(person.longitude))throw new Error('יש להזין קואורדינטות תקינות.');
 const natal=calculateNatal({utc:resolved.instant,latitude:person.latitude,longitude:person.longitude});
 const points=natal.planets.map(p=>({...p}));
 const time=Astronomy.AstroTime.FromTerrestrialTime(natal.metadata.ttJulianDay-2451545);
 if(options.includeMeanNodes){
  const n=calculateMeanLunarNodes(time);
  points.push({body:'MeanNorthNode',...zodiacPosition(n.northLongitude)},{body:'MeanSouthNode',...zodiacPosition(n.southLongitude)});
 }
 if(options.includeMeanLilith){const p=calculateMeanBlackMoonLilith(time);points.push({body:'MeanLilith',...zodiacPosition(p.longitude),latitude:p.latitude});}
 return {...natal,name,place:person.place,date:person.date,time:person.time,timeZone:person.timeZone,offsetSeconds:resolved.offsetSeconds,isDST:resolved.isDST,points};
}
export function calculateExperimentalSynastry(first,second,resolver,options={}){
 const charts=[chart(first,resolver,options),chart(second,resolver,options)];
 return {status:'experimental-not-for-public-use',charts,aspects:interAspects(charts[0].points,charts[1].points),options:{includeMeanNodes:!!options.includeMeanNodes,includeMeanLilith:!!options.includeMeanLilith},profile:{zodiac:'tropical',houses:'Placidus',tzdb:'2026b',dut1Seconds:0,deltaT:'Astronomy Engine default Espenak–Meeus',aspectOrbs:aspectRules}};
}
