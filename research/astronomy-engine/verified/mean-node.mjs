import * as Astronomy from 'astronomy-engine';
import {normalize} from '../placidus.mjs';

/** Standalone verified-sample Mean Node only; no True Node or Swiss runtime.
 * Meeus, Astronomical Algorithms, 2nd edition, ch.47 eq.47.7.
 * TT Julian centuries from J2000; add AE nutation in longitude to express
 * the geometric mean node in the true equinox of date, tropical zodiac.
 * A mean node is a defined averaged element, not a smoothed true-node fit.
 * Bounds include a small TT margin; intended civil date coverage 1800–2026.
 */
export function calculateMeanLunarNodes(time){
 if(!(time instanceof Astronomy.AstroTime)||!Number.isFinite(time.tt)||time.tt < -73050.5||time.tt > 9863.5)throw RangeError('Finite AstroTime in experimental coverage required');
 const T=time.tt/36525;
 const meanEquinoxLongitude=125.0445479-1934.1362891*T+0.0020754*T*T+T**3/467441-T**4/60616000;
 const northLongitude=normalize(meanEquinoxLongitude+Astronomy.e_tilt(time).dpsi/3600);
 return {method:'mean',frame:'geocentric tropical true equinox of date',northLongitude,southLongitude:normalize(northLongitude+180)};
}
