/** Isolated, pure-JS local Gregorian time -> POSIX UTC using injected full IANA data.
 * No Intl fallback, no guessed DST, no automatic fold choice or gap shifting.
 * Explicit coverage 1800–2026 in BOTH local and UTC domains. No leap seconds.
 */
export function createHistoricalTimeResolver(data){
 if(data?.schema!==1||data.version!=='2026b'||data.backzone!==true||data.posix!==true||data.validFrom!=='1800-01-01T00:00:00Z'||data.validUntil!=='2027-01-01T00:00:00Z'||data.explicitThrough!=='2028-01-01T00:00:00Z'||!data.zones)throw Error('Unsupported or incomplete TZDB dataset');
 const min=Date.parse(data.validFrom)/1000,max=Date.parse(data.validUntil)/1000;
 // Copy the data so caller mutation cannot alter a resolver after validation.
 const zones=new Map();
 for(const [name,z] of Object.entries(data.zones)){
  const validType=t=>Number.isInteger(t.offset)&&Math.abs(t.offset)<86400&&typeof t.dst==='boolean';
  if(!validType(z.initial)||!Array.isArray(z.transitions))throw Error('Invalid zone types');
  let previous=-Infinity;
  const transitions=z.transitions.map(t=>{
   if(t.length!==3||!Number.isSafeInteger(t[0])||t[0]<=previous||!validType({offset:t[1],dst:t[2]}))throw Error('Invalid transition');
   previous=t[0];return [...t];
  });
  zones.set(name,{initial:{...z.initial},transitions,offsets:new Set([z.initial.offset,...transitions.map(t=>t[1])])});
 }
 function getZone(zone){if(!zones.has(zone))throw RangeError('Unknown IANA time zone');return zones.get(zone);}
 function at(z,seconds){
  let lo=0,hi=z.transitions.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(z.transitions[mid][0]<=seconds)lo=mid+1;else hi=mid;}
  return lo?{offset:z.transitions[lo-1][1],dst:z.transitions[lo-1][2]}:z.initial;
 }
 function timestamp(text){
  if(typeof text!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(text))throw RangeError('UTC seconds required');
  const n=Date.parse(text)/1000;
  if(!Number.isFinite(n)||new Date(n*1000).toISOString().replace('.000Z','Z')!==text)throw RangeError('Invalid date/time');
  return n;
 }
 function offsetAt(instant,zone){
  const seconds=timestamp(instant);
  if(seconds<min||seconds>=max)throw RangeError('UTC date outside supported range');
  const {offset,dst}=at(getZone(zone),seconds);
  return {offsetSeconds:offset,isDST:dst};
 }
 function resolve(date,time,zone){
  if(typeof date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(date)||typeof time!=='string'||!/^\d\d:\d\d(:\d\d)?$/.test(time))throw RangeError('Known local date and time required');
  const local=timestamp(date+'T'+time+(time.length===5?':00':'')+'Z');
  if(local<min||local>=max)throw RangeError('Local date outside supported range');
  const z=getZone(zone),candidates=[];
  for(const offset of z.offsets){
   const utc=local-offset,actual=at(z,utc);
   if(actual.offset!==offset)continue;
   // Never silently drop a valid candidate at a coverage boundary.
   if(utc<min||utc>=max)throw RangeError('UTC date outside supported range');
   candidates.push({instant:new Date(utc*1000).toISOString().replace('.000Z','Z'),offsetSeconds:offset,isDST:actual.dst});
  }
  candidates.sort((a,b)=>a.instant.localeCompare(b.instant));
  return {status:candidates.length===0?'nonexistent':candidates.length===1?'resolved':'ambiguous',timeZone:zone,tzdbVersion:data.version,candidates};
 }
 function requireUnique(date,time,zone){
  const result=resolve(date,time,zone);
  if(result.status!=='resolved')throw RangeError(`Birth time is ${result.status}; explicit clarification required`);
  return result.candidates[0];
 }
 return {resolve,offsetAt,requireUnique};
}
