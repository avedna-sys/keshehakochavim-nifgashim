// Deterministic editorial diagnostics, not a general-purpose semantic similarity model.
export function normalize(text,names=[]){
 for(const n of [...names].sort((a,b)=>b.length-a.length)){
  const escaped=n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  text=text.replace(new RegExp('(?<![\\p{L}\\p{M}])([ולבמכשה]?)'+escaped+'(?![\\p{L}\\p{M}])','gu'),'$1אדם');
 }
 return text.replace(/[.,:;!?—–"״׳()]/g,' ').replace(/\d+(?:\.\d+)?/g,'מספר').replace(/\s+/g,' ').trim();
}

const words=s=>s.split(' ').filter(Boolean);
const grams=(s,n)=>{const w=words(s),set=new Set();for(let i=0;i+n<=w.length;i++)set.add(w.slice(i,i+n).join(' '));return set;};
const dice=(a,b)=>a.size+b.size===0?0:2*[...a].filter(x=>b.has(x)).length/(a.size+b.size);
// Relational actions/questions detected in the prose, not headings or recipe tags.
export const conceptPatterns={
 'partner-choice':/רצון להיות יחד|שותפות יכולה|להרגיש רצוי|מרגיש רצוי|מחווה אחת להוכיח|הקשר הזוגי|רצויות/,
 'intimate-disclosure':/כמות המידע שנמסר|נכונות להבין יותר|מרחב שקט לעיבוד|להכיר לעומק|היקף הפרטים שנבחר לשתף/,
 'family-belonging':/שייכות משפחתית|בן משפחה|מעגל המשפחתי|מן המשפחה/,
 'family-differentiation':/עמדה נפרדת|נפרדות|עמדה משפחתית|אדם בפני עצמו|דרך הביטוי או בבחירה/,
 'family-privacy':/שיחה המשפחתית|בני משפחה|זכות לדעת הכול|תשובה חלקית/,
 'revisable-family-ties':/להשתנות לאורך החיים|צורה של הקשר|תדירות המפגש|בכורה|תפקיד שמישהו/,
 'parental-responsibility':/האחריות של .{1,35} כהורה|האחריות ההורית|ההורה.*אחריות|בתפקיד ההורה.*אחריות/,
 'child-autonomy':/אוטונומיה|התפקיד של .{1,35} אינו ליישב|הילד.*להרגיש|הילד.*לשאול/,
 'educational-guidance':/ההנחיה נקלטה|להציע תנאים מובנים|דרך ההכוונה|ציפייה צריכה להיות מובנת/,
 'requested-help':/איזו עזרה רצויה|הזמנה להתערב|סוג העזרה|הבקשה/,
 'negotiated-availability':/הפוגה בזמינות|זכות לזמינות|זמינות שאינה|היקף.*השתתפות|חובת השתתפות/,
 'shared-enjoyment':/ליהנות יחד|הנאה משותפת|מה רוצים לעשות יחד/,
 'friendship-reciprocity':/בחברות|החברות|הדדיות שניתנת להתאמה/,
};
export function concepts(text){return Object.entries(conceptPatterns).filter(([,re])=>re.test(text)).map(([key])=>key);}
const expected={
 'זוגיות':['partner-choice'],
 'אחים':['family-belonging','family-differentiation','family-privacy','revisable-family-ties'],
 'הורה וילד':['parental-responsibility','child-autonomy','educational-guidance'],
 'חברות':['requested-help','negotiated-availability','shared-enjoyment','friendship-reciprocity'],
};
export function auditRoute(report){
 const c=report.chapters.find(c=>c.id==='summary'),text=c.paragraphs.map(p=>p.text).join(' '),detected=concepts(text),missing=(expected[report.relationship]??[]).filter(x=>!detected.includes(x));
 const axes=c.paragraphs.flatMap(p=>p.claims.flatMap(c=>c.recipe.relationalAxes??[]));
 return {relationship:report.relationship,detectedConcepts:detected,missingRelationalQuestions:missing,relationalAxes:axes,status:missing.length?'needs-review':'passed'};
}
export function compareRelationshipReports(a,b){
 const paragraphs=r=>r.chapters.find(c=>c.id==='summary').paragraphs.map(p=>p.text),pairs=[];
 for(const [i,x] of paragraphs(a).entries())for(const [j,y] of paragraphs(b).entries()){
  const nx=normalize(x,a.names),ny=normalize(y,b.names),cx=new Set(concepts(x)),cy=new Set(concepts(y));
  pairs.push({left:i+1,right:j+1,bigramSimilarity:dice(grams(nx,2),grams(ny,2)),vocabularySimilarity:dice(new Set(words(nx)),new Set(words(ny))),conceptSimilarity:dice(cx,cy),sharedConcepts:[...cx].filter(x=>cy.has(x)),nearDuplicate:nx===ny||dice(grams(nx,2),grams(ny,2))>=.55});
 }
 const ra=auditRoute(a),rb=auditRoute(b),sameConceptProfile=ra.detectedConcepts.length>0&&dice(new Set(ra.detectedConcepts),new Set(rb.detectedConcepts))>=.8;
 return {relationships:[a.relationship,b.relationship],maxParagraphBigramSimilarity:Math.max(0,...pairs.map(p=>p.bigramSimilarity)),nearDuplicateParagraphs:pairs.filter(p=>p.nearDuplicate),conceptualRouteCollapse:a.relationship!==b.relationship&&(sameConceptProfile||ra.missingRelationalQuestions.length>0||rb.missingRelationalQuestions.length>0),routeAudits:[ra,rb],paragraphComparisons:pairs,limits:'Curated relational concepts and paraphrase-sensitive vocabulary diagnostics; not proof of complete semantic novelty.'};
}
