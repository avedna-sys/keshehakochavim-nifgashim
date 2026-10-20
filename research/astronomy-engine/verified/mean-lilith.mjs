import * as Astronomy from 'astronomy-engine';
import {normalize} from '../placidus.mjs';

/** Mean Black Moon Lilith = the Moon's MEAN apogee, not osculating apogee,
 * not an interpolated apogee, and not asteroid 1181 Lilith.
 * Mean lunar node/perigee elements: Meeus, Astronomical Algorithms, 2nd ed.,
 * lunar mean-element polynomials. TT centuries from J2000.
 * The mean perigee longitude is a longitude-of-pericentre orbital element;
 * adding 180 alone is NOT its projected geocentric ecliptic longitude.
 * Project the apogee direction through the mean lunar inclination (5.1454°)
 * and add AE nutation in longitude for the true equinox of date.
 * Original spherical projection; no Swiss code or data in this module.
 */
export function calculateMeanBlackMoonLilith(time){
 if(!(time instanceof Astronomy.AstroTime)||!Number.isFinite(time.tt)||time.tt < -73050.5||time.tt > 9863.5)throw RangeError('Finite AstroTime in experimental 1800–2026 coverage required');
 const T=time.tt/36525,rad=Math.PI/180,deg=180/Math.PI;
 const node=normalize(125.0445479-1934.1362891*T+0.0020754*T*T+T**3/467441-T**4/60616000);
 const perigee=normalize(83.3532465+4069.0137287*T-0.01032*T*T-T**3/80053+T**4/18999000);
 const argument=normalize(perigee+180-node)*rad,inclination=5.1454*rad;
 const longitude=normalize(node+Math.atan2(Math.sin(argument)*Math.cos(inclination),Math.cos(argument))*deg+Astronomy.e_tilt(time).dpsi/3600);
 const latitude=Math.asin(Math.sin(argument)*Math.sin(inclination))*deg;
 return {point:'MeanBlackMoonLilith',method:'mean-lunar-apogee',frame:'geocentric tropical true equinox of date',longitude,latitude,status:'experimental-sample-validated-only'};
}
