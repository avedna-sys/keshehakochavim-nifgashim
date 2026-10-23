import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cases} from '../interpretation/general/phase-e/fixtures.mjs';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const fixture of cases){
  const url=new URL(`../interpretation/general/phase-e/examples/${fixture.id}`,import.meta.url),input=JSON.parse(readFileSync(new URL(url.href+'.json')));
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.setContent(readFileSync(new URL(url.href+'.html'),'utf8'));
  assert.deepEqual(await page.locator('.reading-view article').evaluateAll(ns=>ns.map(n=>[...n.querySelectorAll('p')].map(p=>p.textContent))),input.report.chapters.flatMap(c=>c.paragraphs.map(p=>p.text.split('\n\n'))));
  for(const width of [1366,390]){
   await page.setViewportSize({width,height:900});
   await page.getByLabel('פרשנות ברצף',{exact:true}).check();assert.equal(await page.locator('.source-view').isVisible(),false);
   await page.getByLabel('מקורות מחושבים בנפרד',{exact:true}).check();assert.equal(await page.locator('.reading-view').isVisible(),false);assert.ok(await page.locator('.source-view').isVisible());
   await page.locator('.source-view a').first().click();assert.equal(await page.locator('.fact:target').count(),1);
   await page.getByLabel('פרשנות ומקורות',{exact:true}).check();assert.ok(await page.locator('.reading-view').isVisible());assert.ok(await page.locator('.source-view').isVisible());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).length),0);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await page.close();
 }
 console.log('PASS five phase-E full reports: verbatim DOM, desktop/mobile, all three reading/source modes, working evidence anchors, no overflow/errors/external requests.');
}finally{await browser.close();}
