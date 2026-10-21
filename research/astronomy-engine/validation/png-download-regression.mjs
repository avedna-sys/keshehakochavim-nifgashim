import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const url=process.env.PNG_TEST_URL||'http://127.0.0.1:4178';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 await page.addInitScript(()=>{
  window.pngDiagnostics={imageDecodes:0,canvasBlobs:0,clicks:[]};
  const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(...args){window.pngDiagnostics.imageDecodes++;return decode.apply(this,args);};
  const blob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(...args){window.pngDiagnostics.canvasBlobs++;return blob.apply(this,args);};
  const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(...args){window.pngDiagnostics.clicks.push({filename:this.download,connected:this.isConnected,active:navigator.userActivation.isActive});return click.apply(this,args);};
 });
 await page.goto(url);await page.locator('#research-example').click();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();await page.waitForFunction(()=>document.querySelector('#syn-share')&&!document.querySelector('#syn-share').disabled);
 await page.locator('#syn-zoom').fill('200');await page.locator('#syn-zoom').dispatchEvent('input');
 await page.selectOption('#syn-export-format','pdf');await page.selectOption('#syn-export-format','png');
 const before=await page.evaluate(()=>structuredClone(window.pngDiagnostics));
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-export-download').click()]);assert.equal(download.suggestedFilename(),'synastry-map.png');assert.equal(await download.failure(),null);
 const bytes=readFileSync(await download.path());assert.equal(bytes.readUInt32BE(16),3000);assert.equal(bytes.readUInt32BE(20),4140);writeFileSync('validation/reference-data/png-regression-production.png',bytes);
 const after=await page.evaluate(()=>window.pngDiagnostics);assert.equal(after.imageDecodes,before.imageDecodes);assert.equal(after.canvasBlobs,before.canvasBlobs);assert.ok(after.imageDecodes>0);assert.ok(after.canvasBlobs>0);assert.deepEqual(after.clicks.at(-1),{filename:'synastry-map.png',connected:true,active:true});
 const [manual]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-export-status a[download]').click()]);assert.equal(manual.suggestedFilename(),'synastry-map.png');assert.deepEqual(readFileSync(await manual.path()),bytes);
 assert.equal(await page.locator('#syn-chart [data-point]').count(),20);assert.equal(await page.locator('#syn-chart [data-house]').count(),24);assert.equal(await page.locator('#syn-chart [data-axis]').count(),8);assert.ok(await page.locator('#syn-chart [data-aspect-id]').count()>0);
 // Controlled slow decode: real rasterization, delayed beyond transient activation.
 const cold=await browser.newPage({acceptDownloads:true});await cold.addInitScript(()=>{const original=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=async function(...args){await original.apply(this,args);await new Promise(r=>setTimeout(r,6500));};});
 await cold.goto(url);await cold.locator('#research-example').click();await cold.locator('#birth-form [type=submit]').click();await cold.locator('#syn-chart svg').waitFor();
 const [coldDownload]=await Promise.all([cold.waitForEvent('download'),cold.locator('#syn-export-download').click()]);assert.equal(readFileSync(await coldDownload.path()).readUInt32BE(16),3000);
 const [coldManual]=await Promise.all([cold.waitForEvent('download'),cold.locator('#syn-export-status a[download]').click()]);assert.deepEqual(readFileSync(await coldManual.path()),readFileSync(await coldDownload.path()));await cold.close();
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
 const report={status:'passed',finishedAt:new Date().toISOString(),url,buildType:'production Vite preview',browser:'Chromium desktop',png:[3000,4140],downloadFailure:null,svgDecoded:true,canvasEncoded:true,formatPDFThenPNGWorks:true,cachedPNGNoAwaitOrRerasterization:true,downloadAnchorConnected:true,downloadHasUserActivation:true,manualFallbackIdenticalFile:true,slowDecodeFallbackTested:true,zoomIndependent:true,planetMarks:20,houseCusps:24,axes:8,pageErrors:errors,consoleErrors};writeFileSync('validation/png-download-regression-results.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
