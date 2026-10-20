// Build-only tool. Runtime conversion has no dependency on ICU, Python or zic.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,mkdtempSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
const root=fileURLToPath(new URL('./reference-data/',import.meta.url));
const version='2026b',url=`https://codeload.github.com/eggert/tz/tar.gz/refs/tags/${version}`;
const archiveSha256='bba53da7f6e4fd7739f464ca3356dd9dbe9730c0b098337049f1bbc956b87159';
mkdirSync(root,{recursive:true});
const archive=join(root,'tz2026b.tar.gz');
if(!existsSync(archive))execFileSync('curl',['-fsSL','--max-time','45',url,'-o',archive],{timeout:50000});
if(createHash('sha256').update(readFileSync(archive)).digest('hex')!==archiveSha256)throw Error('TZDB archive hash mismatch; existing file preserved');
// Fresh directory: never overwrite a potentially damaged prior compilation.
const build=mkdtempSync(join(root,'tzdb-build-')),source=join(build,'source'),output=join(build,'zoneinfo');
mkdirSync(source);mkdirSync(output);
execFileSync('tar',['-xzf',archive,'--strip-components=1','-C',source],{timeout:30000});
// Include ALL backzone entries, not post-1970 links that erase Amsterdam history.
execFileSync('make',['PACKRATDATA=backzone','PACKRATLIST=','main.zi'],{cwd:source,timeout:30000});
// Explicit transitions through Jan 2028: supported runtime ends before Jan 2027.
execFileSync('zic',['-b','fat','-R','@1830297600','-d',output,join(source,'main.zi')],{timeout:30000});
function parse(buf){
 function header(at){
  if(buf.toString('ascii',at,at+4)!=='TZif')throw Error('Invalid TZif signature');
  return Array.from({length:6},(_,i)=>buf.readUInt32BE(at+20+i*4));
 }
 if(!['2','3','4'].includes(String.fromCharCode(buf[4])))throw Error('64-bit TZif required');
 const size=(c,w)=>c[3]*(w+1)+c[4]*6+c[5]+c[2]*(w+4)+c[1]+c[0];
 const at=44+size(header(0),4),c=header(at);
 if(c[2])throw Error('Leap-second tables not supported; POSIX TZif required');
 let p=at+44;
 const times=Array.from({length:c[3]},()=>{const n=Number(buf.readBigInt64BE(p));p+=8;if(!Number.isSafeInteger(n))throw Error('Unsafe transition');return n;});
 const indices=Array.from(buf.subarray(p,p+c[3]));p+=c[3];
 const types=Array.from({length:c[4]},()=>{const offset=buf.readInt32BE(p),dst=buf[p+4]===1;p+=6;return {offset,dst};});
 if(indices.some(i=>!types[i]))throw Error('Bad TZif type index');
 // Type zero is the pre-first-transition type specified by TZif (RFC 9636).
 return {initial:types[0],transitions:times.map((t,i)=>[t,types[indices[i]].offset,types[indices[i]].dst])};
}
const zones={};
function visit(dir,prefix=''){
 for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
  const path=join(dir,entry.name),name=prefix+entry.name;
  if(entry.isDirectory())visit(path,name+'/');
  else {const content=readFileSync(path);if(content.subarray(0,4).toString()==='TZif')zones[name]=parse(content);}
 }
}
visit(output);
const data={schema:1,version,url,archiveSha256,backzone:true,posix:true,validFrom:'1800-01-01T00:00:00Z',validUntil:'2027-01-01T00:00:00Z',explicitThrough:'2028-01-01T00:00:00Z',zones};
const dataDirectory=fileURLToPath(new URL('../data/',import.meta.url));mkdirSync(dataDirectory,{recursive:true});
const json=JSON.stringify(data)+'\n';
writeFileSync(join(dataDirectory,'tzdb-2026b.json'),json);
writeFileSync(new URL('./tzdb-provenance.json',import.meta.url),JSON.stringify({version,url,archiveSha256,backzone:true,compiler:execFileSync('zic',['--version'],{encoding:'utf8',timeout:5000}).trim(),datasetSha256:createHash('sha256').update(json).digest('hex'),zones:Object.keys(zones).length,options:['-b','fat','-R','@1830297600'],note:'POSIX times; full backzone; no leap-second table'},null,2)+'\n');
// Machine-specific reference location is intentionally ignored by Git.
writeFileSync(join(root,'tzdb-reference.json'),JSON.stringify({directory:relative(root,output),source:relative(root,source)}));
console.log(`Prepared ${Object.keys(zones).length} full-history IANA zones (${version})`);
