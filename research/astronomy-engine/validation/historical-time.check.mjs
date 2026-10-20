import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
const dataText=readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url),'utf8'),data=JSON.parse(dataText);
const {resolve,offsetAt,requireUnique}=createHistoricalTimeResolver(data);
const fixtures=[
 ['Amsterdam winter','Europe/Amsterdam','1930-01-01','12:00',[1172]],
 ['Amsterdam summer','Europe/Amsterdam','1930-07-01','12:00',[4772]],
 ['Amsterdam 28-second gap','Europe/Amsterdam','1937-07-01','00:00:15',[]],
 ['Jerusalem double summer time','Asia/Jerusalem','1948-06-01','12:00',[14400]],
 ['Jerusalem 2012','Asia/Jerusalem','2012-09-25','12:00',[7200]],
 ['Jerusalem 2013','Asia/Jerusalem','2013-09-25','12:00',[10800]],
 ['Jerusalem gap','Asia/Jerusalem','2024-03-29','02:30',[]],
 ['Jerusalem fold','Asia/Jerusalem','2024-10-27','01:30',[10800,7200]],
 ['Paris mean time','Europe/Paris','1900-01-01','12:00',[561]],
 ['Paris summer','Europe/Paris','2024-07-01','12:00',[7200]],
 ['New York mean time','America/New_York','1880-01-01','12:00',[-17762]],
 ['New York gap','America/New_York','2024-03-10','02:30',[]],
 ['New York fold','America/New_York','2024-11-03','01:30',[-14400,-18000]],
 ['Kathmandu mean time','Asia/Kathmandu','1900-01-01','12:00',[20476]],
 ['Kathmandu 15-minute gap','Asia/Kathmandu','1986-01-01','00:05',[]],
 ['Kathmandu modern','Asia/Kathmandu','2024-01-01','12:00',[20700]],
 ['Lord Howe half-hour gap','Australia/Lord_Howe','2024-10-06','02:15',[]],
 ['Lord Howe half-hour fold','Australia/Lord_Howe','2024-04-07','01:45',[39600,37800]],
 ['Samoa skipped day','Pacific/Apia','2011-12-30','12:00',[]],
 ['Samoa before date line','Pacific/Apia','2011-12-29','12:00',[-36000]],
 ['Samoa after date line','Pacific/Apia','2011-12-31','12:00',[50400]],
];
const python=`import sys,json\nfrom datetime import datetime,timezone\nfrom zoneinfo import ZoneInfo\nfrom pathlib import Path\nroot=sys.argv[1]\ncache={}\nout=[]\nfor c in json.load(sys.stdin):\n z=c['zone']\n if z not in cache:\n  if root=='SYSTEM': cache[z]=ZoneInfo(z)\n  else:\n   with open(root+'/'+z,'rb') as f: cache[z]=ZoneInfo.from_file(f,key=z)\n zone=cache[z]\n local=datetime.fromisoformat(c['local'])\n candidates={}\n for fold in (0,1):\n  dt=local.replace(tzinfo=zone,fold=fold)\n  utc=dt.astimezone(timezone.utc)\n  if utc.astimezone(zone).replace(tzinfo=None)==local:\n   key=utc.strftime('%Y-%m-%dT%H:%M:%SZ')\n   candidates[key]={'instant':key,'offsetSeconds':int(dt.utcoffset().total_seconds()),'isDST':bool(dt.dst())}\n out.append([candidates[k] for k in sorted(candidates)])\nversion=Path('/usr/share/zoneinfo/tzdata.zi').read_text().splitlines()[0]\nprint(json.dumps({'systemVersion':version,'candidates':out}))`;
function reference(cases,path){return JSON.parse(execFileSync('python3',['-c',python,path],{input:JSON.stringify(cases),maxBuffer:32*1024*1024,encoding:'utf8',timeout:30000}));}
test('fixed historical regression fixtures and preserved second offsets',()=>{
 for(const [label,zone,date,time,offsets] of fixtures)assert.deepEqual(resolve(date,time,zone).candidates.map(c=>c.offsetSeconds),offsets,label);
 assert.equal(requireUnique('1930-01-01','12:00','Europe/Amsterdam').instant,'1930-01-01T11:40:28Z');
 assert.equal(requireUnique('1930-07-01','12:00','Europe/Amsterdam').instant,'1930-07-01T10:40:28Z');
});
test('folds/gaps block automatic birth-time selection',()=>{
 assert.throws(()=>requireUnique('2024-11-03','01:30','America/New_York'),/ambiguous/);
 assert.throws(()=>requireUnique('2024-03-10','02:30','America/New_York'),/nonexistent/);
 assert.equal(resolve('2024-04-07','01:45','Australia/Lord_Howe').candidates.length,2);
});
test('invalid and unknown inputs, range edges and malformed data fail closed',()=>{
 for(const args of [['1930-02-30','12:00','Europe/Amsterdam'],['1930-01-01','24:00','UTC'],['1930-01-01','12:00:60','UTC'],['1930-01-01','','UTC'],['1930-01-01','12:00','bad'],['1799-01-01','12:00','UTC'],['2027-01-01','12:00','UTC'],['1800-01-01','00:00','Asia/Kathmandu'],['2026-12-31','23:59','America/New_York']])assert.throws(()=>resolve(...args),RangeError);
 assert.throws(()=>offsetAt('1930-02-30T12:00:00Z','UTC'),RangeError);
 assert.throws(()=>createHistoricalTimeResolver({...data,backzone:false}));
 const bad={...data,zones:{UTC:{initial:{offset:0,dst:false},transitions:[[5,0,false],[4,0,false]]}}};
 assert.throws(()=>createHistoricalTimeResolver(bad),/transition/);
});
test('every zone and selected historical transition edges agree with independent Python conversion',()=>{
 const startedAt=new Date().toISOString();
 const provenance=JSON.parse(readFileSync(new URL('./tzdb-provenance.json',import.meta.url)));
 assert.equal(createHash('sha256').update(dataText).digest('hex'),provenance.datasetSha256);
 const root=fileURLToPath(new URL('./reference-data/',import.meta.url));
 const manifest=JSON.parse(readFileSync(join(root,'tzdb-reference.json')));
 const selected=['Europe/Amsterdam','Europe/Paris','Asia/Jerusalem','Asia/Kathmandu','America/New_York','Australia/Lord_Howe','Pacific/Apia','Europe/London','Asia/Kolkata','America/Sao_Paulo','Africa/Casablanca','Europe/Moscow'];
 const cases=fixtures.map(([,zone,date,time])=>({zone,local:date+'T'+time+(time.length===5?':00':'')}));
 const transitionCounts={},min=Date.parse('1800-01-03T00:00:00Z')/1000,max=Date.parse('2026-12-29T00:00:00Z')/1000;
 for(const [zone,z] of Object.entries(data.zones)){
  for(const year of [1800,1880,1900,1930,1948,1970,2000,2026])cases.push({zone,local:`${year}-06-01T12:34:56`});
  if(!selected.includes(zone))continue;
  let old=z.initial.offset;transitionCounts[zone]=0;
  for(const [utc,offset] of z.transitions){
   if(utc>min&&utc<max){
    transitionCounts[zone]++;
    // Before, at and inside both edges, including folds/gaps measured in seconds.
    for(const seconds of new Set([utc+old-1,utc+old,utc+offset-1,utc+offset,utc+Math.floor((old+offset)/2)]))cases.push({zone,local:new Date(seconds*1000).toISOString().slice(0,19)});
   }
   old=offset;
  }
 }
 const expected=reference(cases,join(root,manifest.directory));
 let ambiguous=0,nonexistent=0,resolved=0,roundTrips=0,maxUtcDifferenceSeconds=0,maxOffsetDifferenceSeconds=0;
 const mismatches=[];
 for(let i=0;i<cases.length;i++){
  const c=cases[i],actual=resolve(c.local.slice(0,10),c.local.slice(11),c.zone),ref=expected.candidates[i];
  if(JSON.stringify(actual.candidates)!==JSON.stringify(ref))mismatches.push({case:c,actual,reference:ref});
  if(actual.status==='ambiguous')ambiguous++;else if(actual.status==='nonexistent')nonexistent++;else resolved++;
  if(actual.candidates.length===ref.length)for(let j=0;j<ref.length;j++){
   maxUtcDifferenceSeconds=Math.max(maxUtcDifferenceSeconds,Math.abs(Date.parse(actual.candidates[j].instant)-Date.parse(ref[j].instant))/1000);
   maxOffsetDifferenceSeconds=Math.max(maxOffsetDifferenceSeconds,Math.abs(actual.candidates[j].offsetSeconds-ref[j].offsetSeconds));
  }
  for(const candidate of actual.candidates){
   assert.deepEqual(offsetAt(candidate.instant,c.zone),{offsetSeconds:candidate.offsetSeconds,isDST:candidate.isDST});
   assert.equal(new Date(Date.parse(candidate.instant)+candidate.offsetSeconds*1000).toISOString().slice(0,19),c.local);roundTrips++;
  }
 }
 const fixedCases=fixtures.map(([,zone,date,time])=>({zone,local:date+'T'+time+(time.length===5?':00':'')}));
 const system=reference(fixedCases,'SYSTEM');
 const fixtureResults=fixtures.map(([label,zone,date,time,offsets],i)=>{
  const actual=resolve(date,time,zone),ref=expected.candidates[i],sys=system.candidates[i];
  return {label,zone,date,time,expectedOffsetsSeconds:offsets,actual,reference:ref,systemReference:sys,match:JSON.stringify(actual.candidates)===JSON.stringify(ref),systemMatch:JSON.stringify(actual.candidates)===JSON.stringify(sys)};
 });
 const result={status:mismatches.length||fixtureResults.some(f=>!f.systemMatch)?'failed':'passed-experimental-sample-only',startedAt,finishedAt:new Date().toISOString(),node:process.version,python:execFileSync('python3',['--version'],{encoding:'utf8'}).trim(),tzdb:data.version,provenance,zones:Object.keys(data.zones).length,cases:cases.length,transitionCounts,resolved,ambiguous,nonexistent,roundTrips,maxUtcDifferenceSeconds,maxOffsetDifferenceSeconds,mismatches,systemVersion:system.systemVersion,fixtureResults,referenceLimitation:'Python ZoneInfo uses an independent TZif parser/converter, with the same pinned IANA history. System TZDB is an additional packaging check, not an independent archive of historical laws.'};
 writeFileSync(new URL('./historical-time-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({...result,fixtureResults:undefined,provenance:undefined,transitionCounts:undefined,mismatches:mismatches.length}));
 assert.equal(mismatches.length,0,'See current historical-time-results.json');
 assert.ok(fixtureResults.every(f=>f.systemMatch),'System IANA reference mismatch; inspect results');
});
