import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const directory=fileURLToPath(new URL('../integrated-dist/',import.meta.url));
let html=readFileSync(join(directory,'index.html'),'utf8');
const script=html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/),style=html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if(!script||!style)throw Error('Unexpected integrated Vite output');
const local=url=>join(directory,url.replace(/^\//,'')),uri=(file,mime)=>`data:${mime};base64,${readFileSync(local(file)).toString('base64')}`;
let js=readFileSync(local(script[1]),'utf8'),css=readFileSync(local(style[1]),'utf8');
const datasets=[...js.matchAll(/"(\/assets\/tzdb-[^"]+\.json)"/g)];if(datasets.length!==1)throw Error('Expected one pinned TZDB asset');
js=js.replace(JSON.stringify(datasets[0][1]),JSON.stringify(uri(datasets[0][1],'application/json')));
for(const [file,mime] of [['/background.jpg','image/jpeg'],['/synastry-logo.png','image/png'],['/creator-portrait.png','image/png'],['/logo.svg','image/svg+xml']]){
 const data=uri(file,mime);js=js.replaceAll(file,data);css=css.replaceAll(file,data);html=html.replaceAll(file,data);
}
if(/<\/script/i.test(js)||/<\/style/i.test(css))throw Error('Unsafe inline delimiter');
html=html.replace(script[0],()=>`<script type="module">${js}</script>`).replace(style[0],()=>`<style>${css}</style>`);
writeFileSync(join(directory,'website-preview.html'),html);
console.log('Created integrated-dist/website-preview.html with branding, TZDB and calculation modules embedded');
