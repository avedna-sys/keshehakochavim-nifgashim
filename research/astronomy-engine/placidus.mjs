import * as Astronomy from 'astronomy-engine';
const rad=Math.PI/180,deg=180/Math.PI;
export const normalize=x=>((x%360)+360)%360;
export const signedDifference=(a,b)=>normalize(a-b+180)-180;
/** Original semi-diurnal/semi-nocturnal arc solver; true equator/equinox of date.
 * No polar fallback. Not copied from Swiss Ephemeris. */
export function calculatePlacidus(time,latitude,longitude){
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw RangeError('Invalid coordinates');
 const eps=Astronomy.e_tilt(time).tobl*rad;
 if(Math.abs(latitude)>=90-eps*deg)throw RangeError('Placidus unavailable at polar latitude');
 const theta=normalize(Astronomy.SiderealTime(time)*15+longitude),t=theta*rad;
 const mc=normalize(Math.atan2(Math.sin(t),Math.cos(t)*Math.cos(eps))*deg);
 const asc=normalize(Math.atan2(Math.cos(t),-(Math.sin(t)*Math.cos(eps)+Math.tan(latitude*rad)*Math.sin(eps)))*deg);
 const ic=normalize(mc+180),dsc=normalize(asc+180);
 function equation(lambda,house){
  const l=lambda*rad;
  const ra=normalize(Math.atan2(Math.sin(l)*Math.cos(eps),Math.cos(l))*deg);
  const dec=Math.asin(Math.sin(l)*Math.sin(eps));
  const q=-Math.tan(latitude*rad)*Math.tan(dec);
  if(Math.abs(q)>=1)throw RangeError('Circumpolar Placidus cusp');
  const semiDay=Math.acos(q)*deg;
  const target=house===11?semiDay/3:house===12?2*semiDay/3:house===2?180-2*(180-semiDay)/3:180-(180-semiDay)/3;
  return normalize(ra-theta)-target;
 }
 function solve(house){
  let lo=mc+1e-8,hi=mc+180-1e-8;
  if(equation(lo,house)>=0||equation(hi,house)<=0)throw Error('Placidus bracket failed');
  for(let i=0;i<64;i++){const mid=(lo+hi)/2;if(equation(mid,house)>0)hi=mid;else lo=mid;}
  const result=(lo+hi)/2;
  if(Math.abs(equation(result,house))>1e-7)throw Error('Placidus convergence failed');
  return normalize(result);
 }
 const cusps=Array(12);
 cusps[0]=asc;cusps[3]=ic;cusps[6]=dsc;cusps[9]=mc;
 for(const house of [11,12,2,3]){cusps[house-1]=solve(house);cusps[(house+5)%12]=normalize(cusps[house-1]+180);}
 let sum=0;
 for(let i=0;i<12;i++){const span=normalize(cusps[(i+1)%12]-cusps[i]);if(span<=0||span>=180)throw Error('Invalid cusp order');sum+=span;}
 if(Math.abs(sum-360)>1e-6)throw Error('Invalid cusp winding');
 return {system:'Placidus',asc,dsc,mc,ic,cusps};
}
