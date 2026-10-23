import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {fileURLToPath} from 'node:url';
const base=process.env.CHART_URL||'http://127.0.0.1:5174';
const out=fileURLToPath(new URL('./reference-data/',import.meta.url));mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto(base);await page.locator('#chart svg').waitFor();
 assert.equal(await page.locator('#chart [data-point]').count(),20);
 const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
 const expected=calculateExperimentalSynastry({name:'first',date:'1990-05-17',time:'09:30:00',latitude:31.7683,longitude:35.2137,timeZone:'Asia/Jerusalem'},{name:'second',date:'1992-10-08',time:'18:45:00',latitude:52.3676,longitude:4.9041,timeZone:'Europe/Amsterdam'},resolver);
 for(let person=0;person<2;person++)for(const p of expected.charts[person].points){
  const actual=Number(await page.locator(`#chart [data-point=${p.body}][data-person="${person}"]`).getAttribute('data-longitude'));
  assert.ok(Math.abs(actual-p.longitude)<1e-8,'browser positions match verified numeric engine');
 }
 assert.equal(await page.locator('#chart [data-house]').count(),24);
 assert.equal(await page.locator('#chart [data-axis]').count(),8);
 const aspects=await page.locator('#chart [data-aspect-id]').count();assert.ok(aspects>0);assert.equal(await page.locator('#aspect-rows tr').count(),aspects);
 await page.locator('#aspect-rows button').first().click();assert.equal(await page.locator('#aspect-rows button[aria-pressed=true]').count(),1);
 await page.selectOption('#aspect-filter','trine');assert.ok((await page.locator('#aspect-rows').innerText()).includes('משולש'));
 await page.selectOption('#aspect-filter','all');
 const saved=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);assert.equal(saved[0].suggestedFilename(),'synastry-experiment.svg');
 const exported=readFileSync(await saved[0].path(),'utf8');assert.match(exported,/xmlns="http:\/\/www.w3.org\/2000\/svg"/);assert.equal((exported.match(/data-point=/g)||[]).length,20);
 // Verify browser geometry against declared longitudes and projection, not canned values.
 const geometry=await page.locator('#chart svg').evaluate(svg=>{
  const asc=Number(svg.querySelector('[data-axis=ASC][data-person="0"]').dataset.longitude);
  return [...svg.querySelectorAll('[data-point]')].every(g=>{
   const line=g.querySelector('line'),angle=(Number(g.dataset.longitude)-asc+180)*Math.PI/180,r=Number(g.dataset.person)?359:239;
   return Math.abs(Number(line.getAttribute('x1'))-(500+r*Math.cos(angle)))<1e-7&&Math.abs(Number(line.getAttribute('y1'))-(500-r*Math.sin(angle)))<1e-7;
  });
 });assert.equal(geometry,true);
 await page.locator('#results').screenshot({path:out+'synastry-desktop.png'});
 await page.locator('[name=meanNodes]').check();assert.equal(await page.locator('#results').isVisible(),false);
 await page.locator('[name=meanLilith]').check();await page.locator('button[type=submit]').click();assert.equal(await page.locator('#chart [data-point]').count(),26);
 // Historic Amsterdam seconds survive all the way to the visible summary.
 await page.selectOption('[name=place0]','1');await page.locator('[name=date0]').fill('1930-01-01');await page.locator('[name=time0]').fill('12:00:00');await page.locator('button[type=submit]').click();assert.ok((await page.locator('#summaries').innerText()).includes('1930-01-01T11:40:28Z'));
 // Stale charts disappear and folds/gaps never generate an output map.
 await page.selectOption('[name=place0]','3');await page.locator('[name=date0]').fill('2024-11-03');await page.locator('[name=time0]').fill('01:30:00');await page.locator('button[type=submit]').click();assert.equal(await page.locator('#results').isVisible(),false);assert.match(await page.locator('#message').innerText(),/כפולה/);
 await page.locator('[name=date0]').fill('2024-03-10');await page.locator('[name=time0]').fill('02:30:00');await page.locator('button[type=submit]').click();assert.match(await page.locator('#message').innerText(),/אינה קיימת/);
 await page.locator('#example').click();
 // Names are rendered as text, never executable markup.
 await page.locator('[name=name0]').fill('<img src=x onerror=alert(1)>');await page.locator('button[type=submit]').click();assert.equal(await page.locator('#pair-title img').count(),0);assert.match(await page.locator('#pair-title').innerText(),/<img/);
 await page.locator('#example').click();
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile page has no horizontal overflow');
 await page.locator('#results').screenshot({path:out+'synastry-mobile.png'});
 await page.locator('#zoom').fill('175');await page.locator('#zoom').dispatchEvent('input');assert.ok(await page.locator('.chart-scroll').evaluate(e=>e.scrollWidth>e.clientWidth));
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const result={status:'passed',url:base,desktop:{width:1440,height:1100},mobile:{width:390,height:844},planetMarks:20,houseCusps:24,axes:8,aspects,extendedMarks:26,geometry:true,numericEngineMatch:true,svgDownload:true,amsterdam1930:true,gapBlocked:true,foldBlocked:true,staleResultsCleared:true,namesEscaped:true,noExternalRequests:true,pageErrors:errors,finishedAt:new Date().toISOString()};
 writeFileSync(new URL(base.includes('synastry-preview.html')?'./browser-standalone-results.json':'./browser-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
