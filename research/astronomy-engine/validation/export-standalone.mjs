// Package the experimental Vite output only; never write to public/ or root dist/.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const directory=fileURLToPath(new URL('../browser-dist/',import.meta.url));
let html=readFileSync(join(directory,'index.html'),'utf8');
const script=html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/),style=html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if(!script||!style)throw Error('Unexpected Vite output');
const localPath=url=>join(directory,url.replace(/^\//,''));
let js=readFileSync(localPath(script[1]),'utf8');
const jsonAssets=[...js.matchAll(/"(\/assets\/tzdb-[^"]+\.json)"/g)];
if(jsonAssets.length!==1)throw Error('Expected one pinned TZDB asset');
const source=jsonAssets[0][1],encoded=readFileSync(localPath(source)).toString('base64');
js=js.replace(JSON.stringify(source),JSON.stringify('data:application/json;base64,'+encoded));
if(/<\/script/i.test(js))throw Error('Unsafe script delimiter in compiled module');
const css=readFileSync(localPath(style[1]),'utf8');
html=html.replace(script[0],()=>'<script type="module">'+js+'</script>').replace(style[0],()=>'<style>'+css+'</style>');
writeFileSync(join(directory,'synastry-preview.html'),html);
console.log('Created standalone browser-dist/synastry-preview.html; includes pinned TZDB, no external requests');
