import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateExperimentalSynastry} from '../synastry.mjs';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {buildFindings} from '../interpretation/facts.mjs';
import {createPhaseFInterpretation,validatePhaseFReport} from '../interpretation/general/phase-f/generate.mjs';
import {commitmentPlan,seven,closure} from '../interpretation/general/phase-f/plan.mjs';
import {commitmentMeaning} from '../interpretation/general/phase-f/render.mjs';
import {cases} from '../interpretation/general/phase-f/fixtures.mjs';
import {createSynthesisInterpretation} from '../interpretation/general/phase-d/generate.mjs';
import {createPhaseEInterpretation} from '../interpretation/general/phase-e/generate.mjs';
const resolver=createHistoricalTimeResolver(JSON.parse(readFileSync(new URL('../data/tzdb-2026b.json',import.meta.url))));
function input(fixture,reverse=false){
 const people=fixture.people.map((p,i)=>({...p,name:fixture.names[i]})),participants=people.map((_,i)=>({id:i?'second':'first',...(fixture.roles?{role:fixture.roles[i]}:{})}));
 if(reverse){people.reverse();participants.reverse();}
 return {pair:{...calculateExperimentalSynastry(...people,resolver),relationship:fixture.relationship},participants};
}
const run=s=>{const x=input(s);return createPhaseFInterpretation(x.pair,{participants:x.participants});};
const prose=r=>r.report.chapters.map(c=>({title:c.title,paragraphs:c.paragraphs.map(p=>p.text)}));
test('six freshly calculated maps, only three new chapters, input/facts/earlier chapters unchanged',()=>{
 for(const fixture of cases){const x=input(fixture),before=JSON.stringify(x.pair),d=createSynthesisInterpretation(x.pair,{participants:x.participants}),e=createPhaseEInterpretation(x.pair,{participants:x.participants}),r=createPhaseFInterpretation(x.pair,{participants:x.participants});
  assert.equal(before,JSON.stringify(x.pair));assert.deepEqual(r.facts,buildFindings(x.pair));assert.deepEqual(r.report.chapters.map(c=>c.id),['commitment','growth','summary']);assert.equal(r.report.scope.phaseG,false);assert.equal(r.report.scope.uiIntegration,false);
  assert.deepEqual(createSynthesisInterpretation(x.pair,{participants:x.participants}),d);assert.deepEqual(createPhaseEInterpretation(x.pair,{participants:x.participants}),e);
 }
});
test('reversal preserves full prose and stable geometric ownership on all maps',()=>{
 for(const fixture of cases){const a=run(fixture),x=input(fixture,true),b=createPhaseFInterpretation(x.pair,{participants:x.participants});assert.deepEqual(prose(a),prose(b));assert.deepEqual(a.report.ledger.map(e=>e.key),b.report.ledger.map(e=>e.key));}
});
test('seven chapter coverage, all references accounted, one independent row per geometry',()=>{
 for(const fixture of cases){const r=run(fixture),ids=r.report.ledger.map(e=>e.factId);assert.equal(new Set(ids).size,ids.length);assert.equal(new Set(r.report.ledger.map(e=>e.key)).size,ids.length);assert.deepEqual(r.report.coverage.map(c=>c.topic),seven);
  const all=new Set(r.report.selectionTrace.flatMap(t=>t.selected.map(i=>i.factId)));assert.deepEqual(new Set(ids),all);assert.equal(r.report.summaryPlan.uniqueAspectCount,all.size);
  for(const row of r.report.ledger){assert.equal(row.independentWeight,1);for(const topic of row.origins)assert.ok(r.report.selectionTrace.find(t=>t.topic===topic).selected.some(i=>i.factId===row.factId));}
  for(const c of r.report.chapters)for(const p of c.paragraphs)for(const claim of p.claims)for(const b of claim.aspectBindings){assert.ok(claim.evidenceIds.includes(b.factId));assert.ok(claim.evidenceIds.includes(b.focal.positionId));assert.ok(claim.evidenceIds.includes(b.counter.overlayId));}
 }
 const a=run(cases[0]);assert.ok(a.report.ledger.some(e=>e.origins.length>=3),'Exercise repeated cross-chapter use without votes');
});
test('sparse commitment is reassessed contextually: one moderate agreement channel, two wide sources, no central promotion',()=>{
 const s=cases.at(-1),x=input(s),plan=commitmentPlan(buildFindings(x.pair),x.participants),r=run(s),chapter=r.report.chapters[0];assert.equal(plan.active.length,1);assert.equal(plan.selected.length,3);assert.equal(plan.active[0].role,'contextual');assert.equal(plan.active[0].central,false);assert.equal(plan.active[0].counterBody,'Mercury');assert.ok(Math.abs(plan.active[0].orb-3.127793)<.000001);
 assert.equal(plan.sourceOnly.length,2);assert.ok(chapter.paragraphs[0].text.includes('סימנים מתונים'));assert.ok(chapter.paragraphs[0].sourceOnlyEvidenceIds.some(id=>id.startsWith('aspect:')));assert.ok(!chapter.paragraphs[0].text.includes('אין יציבות'));
});
test('negative controls reject owner, sign, own/overlay house, orb, mode, weight, provenance, prose, role and duplication changes',()=>{
 const x=input(cases[0]),r=run(cases[0]),claims=report=>report.chapters.flatMap(c=>c.paragraphs.flatMap(p=>p.claims));
 const mutations=[report=>claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].focal.person=1-claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].focal.person,report=>claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].counter.sign='מזל שגוי',report=>claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].focal.natalHouse=-1,report=>claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].counter.partnerHouse=2,report=>claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].orb+=.01,report=>claims(report).find(c=>c.aspectBindings.length).aspectBindings[0].mode='unknown',report=>report.ledger.push(structuredClone(report.ledger[0])),report=>report.ledger[0].independentWeight=2,report=>claims(report)[0].text+=' משפט זר',report=>claims(report)[0].evidenceIds.pop(),report=>report.summaryPlan.selected[0].central=false,report=>report.coverage.pop(),report=>report.scope.phaseG=true,report=>report.participants[0].role='parent'];
 for(const mutate of mutations){const damaged=structuredClone(r.report);mutate(damaged);assert.throws(()=>validatePhaseFReport(x.pair,x.participants,damaged));}
});
test('Saturn/Jupiter supportive, challenging and conjunction meanings are distinct, including genuine computed modes',()=>{
 const seen=new Set();for(const fixture of cases){const r=run(fixture);for(const p of r.report.chapters[0].paragraphs)for(const claim of p.claims)for(const b of claim.aspectBindings)if(['Saturn','Jupiter'].includes(b.focal.body))seen.add(b.focal.body+':'+b.mode);}
 assert.ok(seen.has('Saturn:resource'));assert.ok(seen.has('Saturn:tension'));assert.ok(seen.has('Jupiter:resource'));assert.ok(seen.has('Jupiter:blend'));
 for(const planet of ['Saturn','Jupiter'])for(const other of ['Sun','Moon','Mercury','Venus','Mars']){const text=['resource','tension','blend'].map(mode=>commitmentMeaning({focal:{body:planet},counter:{body:other},mode}));assert.equal(new Set(text).size,3);}
});
test('family/friend/sibling prose cannot contain romantic content; explicit parent roles remain asymmetric',()=>{
 for(const fixture of cases.slice(2,5)){const r=run(fixture),text=JSON.stringify(prose(r));for(const bad of ['רומנט','תשוקה','מיניות','משיכה','חיזור','זוגי'])assert.ok(!text.includes(bad));}
 const s=cases[3],x=input(s),r=run(s),text=JSON.stringify(prose(r));assert.ok(text.includes('איתן כהורה'));assert.ok(text.includes('יעל אינו נדרש לספק להורה יציבות'));assert.throws(()=>createPhaseFInterpretation(x.pair,{participants:[{id:'first'},{id:'second'}]}));
 const reversed=input(s,true);assert.deepEqual(prose(createPhaseFInterpretation(reversed.pair,{participants:reversed.participants})),prose(r));
});
test('boundary and optional mean points cannot acquire primary narrative status; conjunction is never labeled resource',()=>{
 const s=cases[0],x=input(s),r=run(s);for(const row of r.report.ledger){const f=r.facts.facts.find(f=>f.id===row.factId);assert.ok(!f.nearBoundary);if(f.type==='conjunction')assert.equal(row.representative.mode,'blend');}
 const people=s.people.map((p,i)=>({...p,name:s.names[i]})),pair={...calculateExperimentalSynastry(...people,resolver,{includeMeanNodes:true,includeMeanLilith:true}),relationship:s.relationship};const extra=createPhaseFInterpretation(pair,{participants:x.participants});assert.deepEqual(prose(extra),prose(r));
});
test('summary is newly composed, not copied paragraphs of previous chapters, and uses eligible evidence only',()=>{
 for(const fixture of cases){const x=input(fixture),r=run(fixture),prior=[createSynthesisInterpretation(x.pair,{participants:x.participants}).report,createPhaseEInterpretation(x.pair,{participants:x.participants}).report],old=prior.flatMap(r=>r.chapters.flatMap(c=>c.paragraphs.map(p=>p.text)));
  for(const p of r.report.chapters[2].paragraphs)assert.ok(!old.some(t=>t===p.text||p.text.includes(t)));
  for(const item of r.report.summaryPlan.selected)assert.ok(r.report.ledger.find(e=>e.factId===item.factId).rank>0);
 }
});
test('all ruler claims retain closure through cusp, position and actual cross-person overlay',()=>{
 for(const fixture of cases){const r=run(fixture);for(const p of r.report.chapters[0].paragraphs)for(const claim of p.claims)for(const id of claim.evidenceIds.filter(id=>id.startsWith('ruler:')))for(const ref of closure(r.facts,[id]))assert.ok(claim.evidenceIds.includes(ref));}
});
test('renaming does not select different astrology and all empty/nonempty coverage claims are measured',()=>{
 const s=cases[0],x=input(s),r=run(s);x.pair.charts.forEach(c=>c.name='שם זהה');const renamed=createPhaseFInterpretation(x.pair,{participants:x.participants});assert.deepEqual(renamed.report.ledger.map(e=>e.key),r.report.ledger.map(e=>e.key));
 for(const row of r.report.coverage)assert.equal(row.active,r.report.selectionTrace.find(t=>t.topic===row.topic).selected.filter(i=>i.role!=='secondary').length);
});

test('no fixed two-finding cap: every distinct central source remains in growth and weak contacts stay source-only',()=>{
 const counts=[];for(const fixture of cases){const r=run(fixture),growth=r.report.selectionTrace.find(t=>t.topic==='growth'),active=new Set(growth.selected.map(i=>i.factId));
  for(const row of r.report.ledger.filter(e=>e.rank===3))assert.ok(active.has(row.factId));
  assert.ok(growth.selected.every(i=>i.role!=='secondary'));counts.push(active.size);
 }
 assert.ok(Math.max(...counts)>2);assert.ok(new Set(counts).size>1);
});

test('body-specific growth meanings distinguish emotional depth from ambiguity, not just planet names',async()=>{
 const {dynamicMeaning}=await import('../interpretation/general/phase-f/meanings.mjs');
 const moonPluto=dynamicMeaning({focal:{body:'Moon'},counter:{body:'Pluto'},mode:'tension'}),moonNeptune=dynamicMeaning({focal:{body:'Moon'},counter:{body:'Neptune'},mode:'tension'});
 assert.ok(moonPluto.includes('הלחץ להסבר'));assert.ok(moonNeptune.includes('ציפיות לא מפורשות'));assert.notEqual(moonPluto,moonNeptune);
 for(const pair of [['Moon','Pluto'],['Mercury','Saturn'],['Moon','Neptune'],['Mars','Mars'],['Sun','Venus']]){
  const clauses=['resource','tension','blend'].map(mode=>dynamicMeaning({focal:{body:pair[0]},counter:{body:pair[1]},mode}));assert.equal(new Set(clauses).size,3);assert.ok(clauses.every(t=>t.length>30));
 }
});

test('reassessment admits relevant moderate Saturn channels and rejects very wide Saturn/Jupiter despite their chapter relevance',()=>{
 const r=run(cases[0]),x=input(cases[0]),plan=commitmentPlan(r.facts,x.participants);
 for(const counterBody of ['Venus','Mercury']){const i=plan.active.find(i=>i.focalBody==='Saturn'&&i.counterBody===counterBody);assert.equal(i.role,'contextual');assert.equal(i.central,false);assert.equal(i.admission.decision,'qualified-context');assert.ok(i.admission.newFunction);}
 assert.ok(plan.sourceOnly.some(i=>i.focalBody==='Saturn'&&i.counterBody==='Moon'&&i.orb>7));assert.ok(plan.sourceOnly.some(i=>i.focalBody==='Jupiter'&&i.orb>5));
 for(const i of plan.selected){const original=r.facts.facts.find(f=>f.id===i.factId);assert.equal(i.orb,original.orb);assert.equal(i.limit,original.limit);}
});
test('summary contains no technical selection language, aspect lists or fabricated absence conclusions',()=>{
 const forbidden=['נקודת המשען שנבחרה','הכיסוי הפעיל כולל','נבדקו שבעת','לא נבחר ממצא להובלה','בתחום ביטחון רגשי נוסף המגע','היבט חיובי או שלילי','אורב','סף משקל'];
 for(const fixture of cases){const r=run(fixture),text=r.report.chapters[2].paragraphs.map(p=>p.text).join(' ');for(const phrase of forbidden)assert.ok(!text.includes(phrase),phrase);assert.ok(!/בית \d|\d+°/.test(text));for(const absent of ['אין אהבה','אין מחויבות','אין תקשורת','אין אינטימיות'])assert.ok(!text.includes(absent));}
});
test('semantic plan assigns a distinct job to each paragraph and no normalized long sentence repeats within a chapter',()=>{
 for(const fixture of cases){const r=run(fixture);for(const c of r.report.chapters){const intents=c.paragraphs.flatMap(p=>p.claims.map(c=>c.recipe.intent));assert.equal(new Set(intents).size,intents.length);const seen=new Set();
  for(const p of c.paragraphs)for(let sentence of p.text.split(/[.!?;\n]+/)){for(const name of r.report.names)sentence=sentence.split(name).join('אדם');sentence=sentence.replace(/\d+(?:\.\d+)?/g,'מספר').replace(/\s+/g,' ').trim();if(sentence.split(' ').length<12)continue;assert.ok(!seen.has(sentence),'Repeated idea carrier: '+sentence);seen.add(sentence);}
 }}
});
test('growth explicitly connects a shared owner response: Saturn support for affection and restraint of speech',()=>{
 const r=run(cases[0]),p=r.report.chapters[1].paragraphs.find(p=>p.text.includes('החופש לנסח ספק'));assert.ok(p);const bs=p.claims[0].aspectBindings;assert.ok(bs.some(b=>[b.focal.body,b.counter.body].includes('Mercury')));assert.ok(bs.some(b=>[b.focal.body,b.counter.body].includes('Venus')));const sat=bs.map(b=>[b.focal,b.counter].find(e=>e.body==='Saturn'));assert.ok(sat.every(e=>e.person===1));assert.ok(p.text.includes('המשאב המסוים הוא אמינות במחווה'));
});
test('summary cannot copy previous full paragraphs or 24-word spans, including the new preceding chapters',()=>{
 const normalize=(text,names)=>{for(const n of names)text=text.split(n).join('אדם');return text.replace(/[.,:;!?—]/g,'').replace(/\s+/g,' ').trim();};
 for(const fixture of cases){const x=input(fixture),r=run(fixture),prior=[createSynthesisInterpretation(x.pair,{participants:x.participants}).report,createPhaseEInterpretation(x.pair,{participants:x.participants}).report],old=[...prior.flatMap(r=>r.chapters.flatMap(c=>c.paragraphs.map(p=>p.text))),...r.report.chapters.slice(0,2).flatMap(c=>c.paragraphs.map(p=>p.text))].map(t=>normalize(t,r.report.names));
  for(const p of r.report.chapters[2].paragraphs){const words=normalize(p.text,r.report.names).split(' ');for(let i=0;i+24<=words.length;i++)assert.ok(!old.some(t=>t.includes(words.slice(i,i+24).join(' '))),'Copied extended passage');}
 }
});
test('non-couple variants preserve role asymmetry, safe language and distinct conclusions across maps',()=>{
 for(const base of [cases[0],cases.at(-1)])for(const relationship of ['חברות','אחים','הורה וילד','אחר']){
  const fixture={...base,relationship,roles:relationship==='הורה וילד'?['parent','child']:undefined},r=run(fixture),summary=r.report.chapters[2].paragraphs.map(p=>p.text).join(' ');for(const bad of ['רומנט','חיזור','תשוקה','משיכה','זוגיות'])assert.ok(!summary.includes(bad));if(relationship==='הורה וילד')assert.ok(summary.includes('התפקיד של '+fixture.names[1]+' אינו'));
 }
});

test('identical geometry across four relationship routes: unchanged facts, distinct paragraphs and relational questions',async()=>{
 const {compareRelationshipReports,auditRoute}=await import('../interpretation/general/phase-f/relationship-audit.mjs');
 for(const base of [cases[0],cases.at(-1)]){
  const reports=['זוגיות','אחים','הורה וילד','חברות'].map(relationship=>run({...base,relationship,roles:relationship==='הורה וילד'?['child','parent']:undefined}));
  const geometry=r=>r.facts.facts.filter(f=>['position','cusp','aspect','overlay','natalAspect'].includes(f.kind));
  for(const r of reports){assert.deepEqual(geometry(r),geometry(reports[0]));assert.equal(auditRoute(r.report).status,'passed');}
  for(let i=0;i<reports.length;i++)for(let j=i+1;j<reports.length;j++){
   const result=compareRelationshipReports(reports[i].report,reports[j].report);assert.equal(result.nearDuplicateParagraphs.length,0,JSON.stringify(result.nearDuplicateParagraphs));assert.equal(result.conceptualRouteCollapse,false);
   assert.ok(result.maxParagraphBigramSimilarity<.55);
  }
 }
});
test('same-geometry audit catches the original defect: a copied emotional paragraph with new names and family heading',async()=>{
 const {compareRelationshipReports}=await import('../interpretation/general/phase-f/relationship-audit.mjs'),couple=run(cases[0]).report,sibling=structuredClone(run(cases[4]).report);
 let text=couple.chapters[2].paragraphs[1].text;for(let i=0;i<2;i++)text=text.split(couple.names[i]).join(sibling.names[i]);sibling.chapters[2].paragraphs[1].text=text;
 const result=compareRelationshipReports(couple,sibling);assert.ok(result.nearDuplicateParagraphs.length>0);assert.equal(result.conceptualRouteCollapse,true);
});
test('concept audit detects relationally recycled paraphrases even without near-identical wording',async()=>{
 const {compareRelationshipReports}=await import('../interpretation/general/phase-f/relationship-audit.mjs');
 const a=structuredClone(run(cases[0]).report),b=structuredClone(run(cases[4]).report);
 const replace=(r,text)=>{r.chapters[2].paragraphs.forEach((p,i)=>p.text=text+' '+i);};
 replace(a,'הרצון להיות יחד כולל רצויות ותחושה של קרבה. עומק אינו נמדד בכמות המידע שנמסר.');
 replace(b,'במרכז החיבור ניצבת רצויות, והיקף הפרטים שנבחר לשתף אינו מבחן לערך המפגש.');
 const result=compareRelationshipReports(a,b);assert.equal(result.nearDuplicateParagraphs.length,0);assert.equal(result.conceptualRouteCollapse,true);assert.ok(result.routeAudits[1].missingRelationalQuestions.includes('family-differentiation'));
});
test('different Moon signs in the same element are never called identical or similar needs',()=>{
 const r=run(cases[3]),positions=r.facts.facts.filter(f=>f.kind==='position'&&f.body==='Moon');assert.equal(positions[0].signIndex%4,positions[1].signIndex%4);assert.notEqual(positions[0].signIndex,positions[1].signIndex);
 const text=r.report.chapters[2].paragraphs.map(p=>p.text).join(' ');assert.ok(!text.includes('דמיון בסגנון'));assert.ok(!text.includes('אותם צרכים'));
 const limited=run(cases.at(-1)).report.chapters[2].paragraphs[1].text;assert.ok(!limited.includes('הדמיון בסגנון'));assert.ok(!limited.includes('הגוון הסמלי המשותף'));
});
test('relational routes do not invent childhood, birth order, shared residence or parental symmetry',()=>{
 for(const base of [cases[0],cases.at(-1)])for(const relationship of ['אחים','הורה וילד','חברות']){
  const r=run({...base,relationship,roles:relationship==='הורה וילד'?['parent','child']:undefined}),text=r.report.chapters[2].paragraphs.map(p=>p.text).join(' ');
  for(const phrase of ['כשהייתם ילדים','האח הבכור','האחות הצעירה','גדלתם יחד','בבית שבו גדלתם','שניהם אחראים באותה מידה'])assert.ok(!text.includes(phrase));
  if(relationship==='הורה וילד'){assert.ok(text.includes('האחריות של '+base.names[0]+' כהורה')||text.includes('בתפקיד ההורה'));assert.ok(text.includes('התפקיד של '+base.names[1]+' אינו'));}
 }
});

test('Hebrew name normalization does not replace a name embedded inside an unrelated word',async()=>{
 const {normalize}=await import('../interpretation/general/phase-f/relationship-audit.mjs');
 assert.equal(normalize('בגלל הצורך של גל אפשר לפנות לגל',['גל']),'בגלל הצורך של אדם אפשר לפנות לאדם');
 assert.equal(normalize('המחווה של אור אינה תלויה במאורע אחר',['אור']),'המחווה של אדם אינה תלויה במאורע אחר');
});
