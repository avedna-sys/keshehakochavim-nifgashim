import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {controlPeople} from '../interpretation/control-fixtures.mjs';
import {buildFindings} from '../interpretation/facts.mjs';
import {compareSwissHouses} from '../interpretation/swiss-house-audit.mjs';
import {renderEditorialReview} from '../interpretation/review-render.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
test('reference ephemeris file SHA-256 hashes match recorded source provenance',()=>{
 const provenance=JSON.parse(readFileSync(new URL('./reference-provenance.json',import.meta.url)));
 for(const [name,hash] of Object.entries(provenance.files))assert.equal(createHash('sha256').update(readFileSync(new URL(`./reference-data/${name}`,import.meta.url))).digest('hex'),hash);
});
test('three synthetic control pairs agree with fresh Swiss Placidus cusp signs, rulers and both house frames',()=>{
 for(const people of controlPeople){const pair={...calculateExperimentalSynastry(...people,resolver),relationship:'זוגיות'},m=buildFindings(pair),r=compareSwissHouses(pair,people,m);assert.equal(r.status,'passed');assert.equal(r.crossHouseChecks,20);assert.equal(r.natalHouseChecks,20);assert.equal(r.cuspsCompared,24);assert.equal(r.standardFrameMembershipChecks,40);}
});
test('separate review view accepts chapter scopes, requires real evidence and escapes personal text',()=>{
 const m=buildFindings({...calculateExperimentalSynastry(...controlPeople[0],resolver),relationship:'זוגיות'}),report={disclosure:'<script>bad</script>',chapters:['love','attraction','intimacy'].map(id=>({id,title:id,paragraphs:[{id:id+':1',title:'<img onerror=bad>',text:'<script>bad</script>',evidenceIds:[m.facts[0].id]}]}))};
 const html=renderEditorialReview(m,report);assert.ok(html.includes('מקורות מחושבים בנפרד'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));assert.ok(html.includes('id="sources"'));assert.ok(html.includes('id="chapter-intimacy"'));
 const bad=structuredClone(report);bad.chapters[0].paragraphs[0].evidenceIds=['missing'];assert.throws(()=>renderEditorialReview(m,bad));
});
