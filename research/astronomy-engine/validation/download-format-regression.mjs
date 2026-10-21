import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const url=process.env.FORMAT_TEST_URL||'http://127.0.0.1:4178';
async function makeChart(page){await page.goto(url);await page.locator('#research-example').click();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();}
try{
 const page=await browser.newPage({acceptDownloads:true,viewport:{width:1440,height:1000}}),errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});await makeChart(page);
 assert.deepEqual(await page.locator('#syn-export-format option').evaluateAll(nodes=>nodes.map(n=>n.value)),['png','pdf','svg']);
 const transitions=[];
 for(const format of ['pdf','png','svg','pdf','svg','png']){
  let selectedDownloads=0;const track=()=>selectedDownloads++;page.on('download',track);await page.selectOption('#syn-export-format',format);await page.waitForTimeout(50);assert.equal(selectedDownloads,0,'Choosing a format must not auto-download');page.off('download',track);
  assert.match(await page.locator('#syn-export-status').innerText(),new RegExp(format.toUpperCase()));assert.equal(await page.locator('#syn-export-download').isEnabled(),true);
  const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-export-download').click()]);assert.equal(await d.failure(),null);const data=readFileSync(await d.path());
  if(format==='pdf'){assert.equal(d.suggestedFilename(),'synastry-map.pdf');assert.equal((await PDFDocument.load(data)).getPageCount(),1);}
  if(format==='png'){assert.equal(d.suggestedFilename(),'synastry-map.png');assert.equal(data.readUInt32BE(16),3000);assert.equal(data.readUInt32BE(20),4140);}
  if(format==='svg'){assert.equal(d.suggestedFilename(),'synastry-research.svg');assert.ok(data.toString().includes('<svg'));assert.equal((data.toString().match(/data-point=/g)||[]).length,20);}
  const [manual]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-export-status a[download]').click()]);assert.deepEqual(readFileSync(await manual.path()),data);transitions.push({selected:format,download:d.suggestedFilename()});await page.waitForTimeout(300); // Pace repeated real downloads like user clicks, not a burst.
 }
 const [legacySVG]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-download').click()]);assert.equal(legacySVG.suggestedFilename(),'synastry-research.svg');
 // Hold PNG preparation while changing selector AFTER requesting PDF.
 const race=await browser.newPage({acceptDownloads:true});await race.addInitScript(()=>{const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=async function(...args){await decode.apply(this,args);await new Promise(r=>setTimeout(r,1200));};});await makeChart(race);await race.selectOption('#syn-export-format','pdf');
 const [pendingPDF]=await Promise.all([race.waitForEvent('download'),race.evaluate(()=>{document.querySelector('#syn-export-download').click();const select=document.querySelector('#syn-export-format');select.value='png';select.dispatchEvent(new Event('change',{bubbles:true}));})]);assert.equal(pendingPDF.suggestedFilename(),'synastry-map.pdf');await race.close();
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.selectOption('#syn-export-format','svg');const [mobile]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-export-download').click()]);assert.equal(mobile.suggestedFilename(),'synastry-research.svg');
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
 const report={status:'passed',finishedAt:new Date().toISOString(),url,build:'production Vite preview',transitions,selectionShowsFeedback:true,selectionDoesNotDownload:true,requestedFormatCapturedBeforeAwait:true,manualLinksMatchAllFormats:true,legacySVGButton:true,mobileNoOverflow:true,pageErrors:errors,consoleErrors};writeFileSync('validation/download-format-regression-results.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
