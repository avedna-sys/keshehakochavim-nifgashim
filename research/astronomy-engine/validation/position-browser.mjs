import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5175');await page.locator('#research-example').click();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();
 assert.equal(await page.locator('[data-person-positions]').count(),2);assert.equal(await page.locator('[data-person-positions="0"] tr').count(),10);assert.equal(await page.locator('#syn-houses tr').count(),16);
 assert.match(await page.locator('[data-position-body=Saturn]').first().innerText(),/ישיר|בנסיגה|לא ודאי/);assert.doesNotMatch(await page.locator('[data-position-body=Saturn]').first().innerText(),/לא מאומת/);
 await page.locator('[data-point=Mercury][data-person="0"] text').first().click();assert.match(await page.locator('#syn-point-detail').innerText(),/מרקורי/);await page.locator('[data-point=Mars][data-person="1"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#syn-point-detail').innerText(),/מאדים/);
 assert.equal(await page.locator('[data-position-degree]').count(),20);
 const visible=await page.locator('[data-position-degree]').evaluateAll(nodes=>nodes.filter(n=>n.getAttribute('visibility')!=='hidden').length);assert.ok(visible>0);
 await page.locator('#syn-position-tables').screenshot({path:'validation/reference-data/position-tables-desktop.png'});
 for(const checkbox of ['mean-nodes','mean-lilith'])await page.locator(`[name="${checkbox}"]`).check();await page.locator('#birth-form [type=submit]').click();await page.locator('#syn-chart svg').waitFor();assert.equal(await page.locator('[data-person-positions="0"] tr').count(),13);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-point=Moon][data-person="0"] text').first().click();assert.match(await page.locator('#syn-point-detail').innerText(),/ירח/);await page.locator('#syn-position-tables').screenshot({path:'validation/reference-data/position-tables-mobile.png'});
 assert.deepEqual(errors,[]);const report={status:'passed',finishedAt:new Date().toISOString(),tables:2,planetRows:20,optionalRows:26,houseAndAxisRows:16,inlineDegreeLabels:20,visibleDegreeLabels:visible,clickAndKeyboard:true,mobileNoOverflow:true,saturnMotionMatchedProfile:true,pageErrors:errors};writeFileSync('validation/position-browser-results.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
