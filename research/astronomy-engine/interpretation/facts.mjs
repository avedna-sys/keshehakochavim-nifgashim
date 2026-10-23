import {bodies,zodiacPosition} from '../engine.mjs';
import {normalize,signedDifference} from '../placidus.mjs';
import {housePlacement} from '../position-details.mjs';
import {interAspects,pointInfo} from '../synastry.mjs';
export const version='interpretation-facts-0.1';
export const traditionalRulers=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
export const rulerForLongitude=longitude=>traditionalRulers[zodiacPosition(longitude).signIndex];
const modern={7:'Pluto',10:'Uranus',11:'Neptune'};
export const priorityProfiles={
 'זוגיות':{1:3,3:4,4:4,5:4,7:5,8:4,11:1},
 'הורה וילד':{1:4,3:3,4:5,5:3,7:1,8:1,11:1},
 'אחים':{1:3,3:4,4:5,5:2,7:2,8:1,11:2},
 'חברות':{1:3,3:4,4:2,5:3,7:3,8:1,11:5},
 'אחר':{1:3,3:3,4:3,5:2,7:2,8:2,11:2},
};
const pid=i=>i?'B':'A';
export function buildFindings(pair){
 if(!pair||pair.charts?.length!==2||pair.profile?.houses!=='Placidus'||pair.profile?.zodiac!=='tropical'||!priorityProfiles[pair.relationship])throw Error('Unsupported interpretation input/profile');
 const facts=[],byId=new Map(),add=f=>{if(byId.has(f.id))throw Error('Duplicate finding');facts.push(f);byId.set(f.id,f);return f;};
 pair.charts.forEach((c,i)=>{
  if(c.status!=='experimental-not-for-public-use'||!c.name||c.houses.system!=='Placidus'||c.houses.cusps.length!==12||!c.houses.cusps.every(x=>Number.isFinite(x)&&x>=0&&x<360))throw Error('Missing calculation or houses');
  const widths=c.houses.cusps.map((v,k)=>normalize(c.houses.cusps[(k+1)%12]-v));if(widths.some(v=>v<=0||v>=180)||Math.abs(widths.reduce((a,b)=>a+b,0)-360)>1e-6)throw Error('Invalid cusp winding');
  if(!bodies.every(b=>c.points.some(p=>p.body===b))||new Set(c.points.map(p=>p.body)).size!==c.points.length)throw Error('Missing/duplicate celestial body');
  for(const p of c.points){if(!pointInfo[p.body]||!Number.isFinite(p.longitude)||p.longitude<0||p.longitude>=360)throw Error('Invalid position');add({id:`pos:${pid(i)}:${p.body}`,kind:'position',person:i,body:p.body,...zodiacPosition(p.longitude),ownHouse:housePlacement(p.longitude,c.houses.cusps),refs:[],baseKeys:[`position:${pid(i)}:${p.body}`]});}
  c.houses.cusps.forEach((longitude,k)=>add({id:`cusp:${pid(i)}:${k+1}`,kind:'cusp',person:i,house:k+1,...zodiacPosition(longitude),nearSignBoundary:Math.min(zodiacPosition(longitude).degreesWithinSign,30-zodiacPosition(longitude).degreesWithinSign)<=1/60,refs:[],baseKeys:[`cusp:${pid(i)}:${k+1}`]}));
 });
 const expected=interAspects(pair.charts[0].points,pair.charts[1].points);
 if(!Array.isArray(pair.aspects)||expected.length!==pair.aspects.length)throw Error('Aspect snapshot does not match positions');
 const key=a=>`${a.first}|${a.second}|${a.type}`,given=new Map(pair.aspects.map(a=>[key(a),a]));
 for(const a of expected){const source=given.get(key(a));if(!source||!Number.isFinite(source.orb)||!Number.isFinite(source.separation)||Math.abs(source.orb-a.orb)>1e-8||Math.abs(source.separation-a.separation)>1e-8)throw Error('Inconsistent computed aspect');
  add({...a,id:`aspect:A:${a.first}:B:${a.second}:${a.type}`,kind:'aspect',firstPerson:0,secondPerson:1,refs:[`pos:A:${a.first}`,`pos:B:${a.second}`],baseKeys:[`aspect:A:${a.first}:B:${a.second}:${a.type}`],quality:a.nearBoundary?'near-orb-cutoff':'sample-validated-profile'});
 }
 pair.charts.forEach((c,i)=>{
  const target=1-i,t=pair.charts[target];
  for(const p of c.points){const placement=housePlacement(p.longitude,t.houses.cusps);add({id:`overlay:${pid(i)}:${p.body}:in:${pid(target)}`,kind:'overlay',person:i,target,body:p.body,longitude:p.longitude,...placement,quality:placement.nearCusp?'near-house-cusp':'time-sensitive',refs:[`pos:${pid(i)}:${p.body}`,`cusp:${pid(target)}:${placement.house}`,`cusp:${pid(target)}:${placement.house%12+1}`],baseKeys:[`overlay:${pid(i)}:${p.body}:in:${pid(target)}`]});}
  for(let h=1;h<=12;h++){
   const cusp=byId.get(`cusp:${pid(i)}:${h}`),ruler=rulerForLongitude(cusp.longitude),position=byId.get(`pos:${pid(i)}:${ruler}`),overlay=byId.get(`overlay:${pid(i)}:${ruler}:in:${pid(target)}`);
   // Overlays of the other chart may not yet be constructed; own overlay always exists.
   const contacts=facts.filter(f=>f.kind==='aspect'&&(i===0?f.first:f.second)===ruler).map(f=>f.id);
   add({id:`ruler:${pid(i)}:${h}`,kind:'ruler',person:i,house:h,cuspSign:cusp.sign,ruler,system:'traditional',quality:cusp.nearSignBoundary?'cusp-sign-sensitive':'time-sensitive',modernSupplement:modern[cusp.signIndex]??null,natalHouse:position.ownHouse.house,partnerHouse:overlay.house,priority:priorityProfiles[pair.relationship][h]??1,contactIds:contacts,refs:[cusp.id,position.id,overlay.id],baseKeys:overlay.baseKeys});
  }
 });
 // Within-chart aspects are separately labeled; never presented as synastry evidence.
 pair.charts.forEach((c,i)=>{const order=new Map(c.points.map((p,j)=>[p.body,j]));for(const a of interAspects(c.points,c.points))if(order.get(a.first)<order.get(a.second))add({...a,id:`natal:${pid(i)}:${a.first}:${a.second}:${a.type}`,kind:'natalAspect',person:i,refs:[`pos:${pid(i)}:${a.first}`,`pos:${pid(i)}:${a.second}`],baseKeys:[`natal:${pid(i)}:${a.first}:${a.second}:${a.type}`]});});
 const core=new Set(['Sun','Moon','Venus','Mars']),coreContacts=facts.filter(f=>f.kind==='aspect'&&core.has(f.first)&&core.has(f.second));
 const patterns=[];if(coreContacts.length>=2)patterns.push({id:'core:SunMoonVenusMars',kind:'coreNetwork',refs:coreContacts.map(f=>f.id),note:'Only calculated edges; no missing contact is inferred'});
 for(const a of coreContacts){const reciprocal=coreContacts.find(b=>b.first===a.second&&b.second===a.first&&a.first!==a.second);if(reciprocal&&a.id<reciprocal.id)patterns.push({id:`reciprocal:${[a.first,a.second].sort().join('-')}`,kind:'reciprocalCore',refs:[a.id,reciprocal.id],note:'Two distinct contacts, not identical or statistically independent evidence'});}
 for(const topic of ['communication','emotions']){
  const focus=topic==='communication'?'Mercury':'Moon';const aspectIds=facts.filter(f=>f.kind==='aspect'&&bodies.includes(f.first)&&bodies.includes(f.second)&&(f.first===focus||f.second===focus)).map(f=>f.id);
  const overlayIds=facts.filter(f=>f.kind==='overlay'&&(f.body===focus||(topic==='emotions'?[4,8]:[3]).includes(f.house)&&core.has(f.body))).map(f=>f.id);
  if(aspectIds.length&&overlayIds.length)patterns.push({id:`theme:${topic}`,kind:'multiChannelTheme',topic,refs:[...aspectIds,...overlayIds],note:'Distinct geometric channels, not probability or independent confirmation'});
 }
 for(const p of patterns)add({...p,baseKeys:[...new Set(p.refs.flatMap(id=>byId.get(id).baseKeys))]});
 for(const f of facts)if(f.refs.some(id=>!byId.has(id)))throw Error('Dangling evidence reference');
 return {version,status:'experimental-symbolic-sample',relationship:pair.relationship,names:pair.charts.map(c=>c.name),profile:pair.profile,facts,coreContacts:coreContacts.map(f=>f.id),priorityHouses:[1,4,5,7,8],quality:{calculation:'experimental sampled validation; not proof for every instant',birthTimeAccuracy:'not supplied; a known time is not a measured uncertainty',houses:'ecliptic longitude placement; birth-time sensitive',interpretation:'symbolic, not scientifically established prediction'},coverage:{chapters:['communication','emotions'],modernRulership:'labeled supplementary data only',complexConfigurations:'not interpreted',axisAspects:'not implemented in this sample',extras:'computed facts retained; no node/Lilith narrative rules or ranking'}};
}
export function findingLabel(f,names){
 const p=i=>names[i],body=b=>pointInfo[b][0],angle=x=>`${x.toFixed(6)}°`;
 if(f.kind==='aspect')return `${body(f.first)} של ${p(0)} ${f.label} ${body(f.second)} של ${p(1)}; אורב ${angle(f.orb)} (סף ${f.limit}°)${f.nearBoundary?' — סמוך לסף':''}`;
 if(f.kind==='overlay')return `${body(f.body)} של ${p(f.person)} בבית ${f.house} של ${p(f.target)}${f.nearCusp?' — סמוך לגבול בית':''}`;
 if(f.kind==='ruler')return `שליט בית ${f.house} של ${p(f.person)}: ${body(f.ruler)} (${f.cuspSign}, שליטה מסורתית), בבית ${f.natalHouse} במפת הלידה ובבית ${f.partnerHouse} של ${p(1-f.person)}`;
 if(f.kind==='position')return `${body(f.body)} של ${p(f.person)}: ${angle(f.longitude)}, ${f.sign}, בית ${f.ownHouse.house}`;
 if(f.kind==='cusp')return `גבול בית ${f.house} של ${p(f.person)}: ${angle(f.longitude)}, ${f.sign}`;
 if(f.kind==='natalAspect')return `${p(f.person)} — מפת לידה: ${body(f.first)} ${f.label} ${body(f.second)}; אורב ${angle(f.orb)}`;
 return `דפוס מחושב: ${f.id}`;
}
