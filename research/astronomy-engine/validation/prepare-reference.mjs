import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const commit='4daf766ab1dec2316a65fcb5f5149e52b4cd9027';
export const files={
 'sepl_12.se1':'8dccace2557601a223d5f8a7cf64de4e6bbb8a82b9b130b95a54d49adfbe546d',
 'semo_12.se1':'1c65fdbb854f350d3de36afc3e4ac126a53f360ae4f6dcb57beed7c690e7eb61',
 'sepl_18.se1':'ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66',
 'semo_18.se1':'1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7'
};
const directory=fileURLToPath(new URL('./reference-data/',import.meta.url));
mkdirSync(directory,{recursive:true});
for(const [name,hash] of Object.entries(files)){
 const path=directory+name;
 const url=`https://raw.githubusercontent.com/aloistr/swisseph/${commit}/ephe/${name}`;
 if(!existsSync(path)){
  const content=execFileSync('curl',['-fsSL','--max-time','45',url],{maxBuffer:4*1024*1024});
  if(createHash('sha256').update(content).digest('hex')!==hash)throw Error(`Reference hash mismatch: ${name}`);
  writeFileSync(path,content);
 }
 if(createHash('sha256').update(readFileSync(path)).digest('hex')!==hash)throw Error(`Reference hash mismatch: ${name}`);
}
writeFileSync(new URL('./reference-provenance.json',import.meta.url),JSON.stringify({repository:'https://github.com/aloistr/swisseph',commit,files},null,2)+'\n');
console.log('All four official Swiss reference files verified by SHA-256');
