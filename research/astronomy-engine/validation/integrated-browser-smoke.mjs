import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {createIntegratedSynastry} from '../../../src/synastry-integration.js';
import {prepareRequest} from '../../../src/synastry.js';
const url=process.env.INTEGRATED_URL||'http://127.0.0.1:5175',output=fileURLToPath(new URL('./reference-data/',import.meta.url));mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],geoRequests=[],nonlocal=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(new URL(url).origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:')&&!r.url().startsWith('https://geocoding-api.open-meteo.com/'))nonlocal.push(r.url());});
 // Controlled responses verify the existing selector workflow, not live API availability.
 await page.route('https://geocoding-api.open-meteo.com/**',async route=>{
  const u=new URL(route.request().url());geoRequests.push(u.toString());
  const fixtures={NL:{id:2759794,name:'אמסטרדם',latitude:52.3676,longitude:4.9041,timezone:'Europe/Amsterdam',admin1:'North Holland'},US:{id:5128581,name:'ניו יורק',latitude:40.7128,longitude:-74.006,timezone:'America/New_York',admin1:'New York'},IL:{id:281184,name:'ירושלים',latitude:31.7683,longitude:35.2137,timezone:'Asia/Jerusalem',admin1:'Jerusalem'}};
  const code=u.searchParams.get('countryCode'),p=fixtures[code];
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:p?[{...p,country_code:code,feature_code:'PPL'}]:[]})});
 });
 await page.goto(url);await page.locator('#research-example').waitFor();
 assert.equal(await page.locator('#synastry-result').isVisible(),false);
 assert.equal(await page.locator('#first-countries option').count(),250);
 assert.equal(await page.locator('[name=relationship]').count(),5);
 assert.match(await page.locator('#creator-image').getAttribute('src'),/creator-portrait|^data:image/);
 assert.match(await page.locator('.zodiac').getAttribute('src'),/synastry-logo|^data:image/);
 await page.locator('#research-example').click();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();
 assert.equal(await page.locator('#syn-chart [data-point]').count(),20);assert.equal(await page.locator('#syn-chart [data-house]').count(),24);assert.equal(await page.locator('#syn-chart [data-axis]').count(),8);
 const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
 const pair=createIntegratedSynastry(prepareRequest({name:'a',date:'1990-05-17',time:'09:30',place:'ירושלים',country:'ישראל'},{name:'b',date:'1992-10-08',time:'18:45',place:'אמסטרדם',country:'הולנד'},'זוגיות'),[{countryCode:'IL',latitude:31.7683,longitude:35.2137,timeZone:'Asia/Jerusalem'},{countryCode:'NL',latitude:52.3676,longitude:4.9041,timeZone:'Europe/Amsterdam'}],resolver);
 for(let person=0;person<2;person++)for(const p of pair.charts[person].points){const n=Number(await page.locator(`#syn-chart [data-point=${p.body}][data-person="${person}"]`).getAttribute('data-longitude'));assert.ok(Math.abs(n-p.longitude)<1e-8);}
 assert.equal(await page.locator('#syn-aspects tr').count(),pair.aspects.length);
 await page.locator('#syn-aspects button').first().click();assert.equal(await page.locator('#syn-aspects button[aria-pressed=true]').count(),1);
 await page.selectOption('#syn-filter','trine');assert.match(await page.locator('#syn-aspects').innerText(),/משולש/);await page.selectOption('#syn-filter','all');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#syn-download').click()]);assert.equal(download.suggestedFilename(),'synastry-research.svg');assert.equal((readFileSync(await download.path(),'utf8').match(/data-point=/g)||[]).length,20);
 await page.locator('#synastry-result').screenshot({path:output+'integrated-desktop-map.png'});
 await page.screenshot({path:output+'integrated-desktop-page.png',fullPage:true});
 await page.locator('[name=mean-nodes]').check();assert.equal(await page.locator('#synastry-result').isVisible(),false);await page.locator('[name=mean-lilith]').check();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();assert.equal(await page.locator('#syn-chart [data-point]').count(),26);
 await page.locator('#first-time').fill('');await page.locator('#birth-form [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#birth-form').hasAttribute('aria-busy'));assert.match(await page.locator('#form-status').innerText(),/שעת לידה ידועה/);assert.equal(await page.locator('#synastry-result').isVisible(),false);
 async function chooseCity(country,query){await page.locator('#first-country').fill(country);await page.locator('#first-place').fill(query);await page.waitForFunction(()=>document.querySelectorAll('#first-cities option').length>0);const value=await page.locator('#first-cities option').first().getAttribute('value');await page.locator('#first-place').fill(value);}
 await page.locator('#research-example').click();await chooseCity('הולנד','Amsterdam');await page.locator('#first-date').fill('1930-01-01');await page.locator('#first-time').fill('12:00');await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();assert.match(await page.locator('#syn-summaries').innerText(),/1930-01-01T11:40:28Z/);
 await chooseCity('ארצות הברית','New York');await page.locator('#first-date').fill('2024-11-03');await page.locator('#first-time').fill('01:30');await page.locator('#birth-form [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#birth-form').hasAttribute('aria-busy'));assert.match(await page.locator('#form-status').innerText(),/פעמיים/);assert.equal(await page.locator('#synastry-result').isVisible(),false);
 await page.locator('#first-date').fill('2024-03-10');await page.locator('#first-time').fill('02:30');await page.locator('#birth-form [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#birth-form').hasAttribute('aria-busy'));assert.match(await page.locator('#form-status').innerText(),/אינה קיימת/);
 await page.locator('#research-example').click();await page.locator('#first-name').fill('<img src=x onerror=alert(1)>');await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();assert.equal(await page.locator('#syn-pair-title img').count(),0);assert.match(await page.locator('#syn-pair-title').innerText(),/<img/);
 await page.locator('#research-example').click();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.locator('#synastry-result').screenshot({path:output+'integrated-mobile-map.png'});await page.screenshot({path:output+'integrated-mobile-page.png',fullPage:true});
 await page.locator('#syn-zoom').fill('175');await page.locator('#syn-zoom').dispatchEvent('input');assert.ok(await page.locator('.syn-chart-scroll').evaluate(e=>e.scrollWidth>e.clientWidth));
 await page.locator('[name=relationship][value="חברות"]').check();assert.equal(await page.locator('#synastry-result').isVisible(),false);
 // Any request in flight must not render stale inputs after an edit.
 const race=await browser.newPage();await race.route('**/tzdb-2026b*',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});await race.goto(url);await race.locator('#research-example').click();await race.locator('#birth-form [type=submit]').click();await race.locator('#first-name').fill('שינוי בזמן טעינה');await race.waitForTimeout(1100);assert.equal(await race.locator('#synastry-result').isVisible(),false);await race.close();
 for(const request of geoRequests){const u=new URL(request);assert.deepEqual([...u.searchParams.keys()].sort(),['count','countryCode','format','language','name'].sort());assert.ok(!request.includes('1990')&&!request.includes('1930'));}
 assert.deepEqual(errors,[]);assert.deepEqual(nonlocal,[]);
 const report={status:'passed',url,finishedAt:new Date().toISOString(),countryOptions:250,relationships:5,brandingPreserved:true,realEngineMatch:true,planetMarks:20,optionalMarks:26,houseCusps:24,axes:8,aspects:pair.aspects.length,svgDownload:true,filterAndHighlight:true,amsterdam1930:true,unknownTimeBlocked:true,foldBlocked:true,gapBlocked:true,staleOutputCleared:true,asyncEditRaceBlocked:true,namesEscaped:true,mobileNoPageOverflow:true,mobileZoom:true,geocoder:'controlled browser fixtures; not proof of live availability',geocodingRequests:geoRequests.length,geocodingPrivacy:true,pageErrors:errors};
 writeFileSync(new URL(url.includes('website-preview.html')?'./integrated-standalone-results.json':'./integrated-browser-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
