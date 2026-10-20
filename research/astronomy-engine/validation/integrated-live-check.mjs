import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const url=process.env.INTEGRATED_URL||'http://127.0.0.1:5175',browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const report={requestFailures:[],consoleErrors:[],url,startedAt:new Date().toISOString(),status:'not-run',mocked:false,locations:[]};
try{
 const page=await browser.newPage();page.on('requestfailed',r=>report.requestFailures.push({url:r.url(),error:r.failure()?.errorText}));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
 page.on('response',async response=>{if(response.url().startsWith('https://geocoding-api.open-meteo.com/')){try{const json=await response.json();report.locations.push({query:new URL(response.url()).searchParams.get('name'),httpStatus:response.status(),firstResult:json.results?.[0]});}catch{}}});
 await page.goto(url);
 for(const [id,country,city,date,time] of [['first','ישראל','Jerusalem','1990-05-17','09:30'],['second','הולנד','Amsterdam','1992-10-08','18:45']]){
  await page.locator(`#${id}-name`).fill(`בדיקת חיפוש חי · ${id==='first'?'א':'ב'}`);await page.locator(`#${id}-date`).fill(date);await page.locator(`#${id}-time`).fill(time);await page.locator(`#${id}-country`).fill(country);await page.locator(`#${id}-place`).fill(city);
  await page.waitForFunction(id=>document.querySelectorAll(`#${id}-cities option`).length>0,id,{timeout:20000});
  const value=await page.locator(`#${id}-cities option`).first().getAttribute('value');await page.locator(`#${id}-place`).fill(value);
 }
 await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor({timeout:20000});assert.equal(await page.locator('#syn-chart [data-point]').count(),20);
 report.status='passed';report.chartLoaded=true;report.summaries=await page.locator('#syn-summaries').innerText();
}catch(error){report.status='failed';report.error=error.message;process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();writeFileSync(new URL('./integrated-live-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();}
