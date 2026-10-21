import {renderChart,colors} from '../research/astronomy-engine/browser/chart.mjs';
import {aspectRules,pointInfo} from '../research/astronomy-engine/synastry.mjs';
import {pointDetails,zodiacParts} from '../research/astronomy-engine/position-details.mjs';
const degrees=x=>`${x.toFixed(6)}°`;
function text(tag,value,className){const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(className)e.className=className;return e;}
function formatted(value){const p=zodiacParts(value);return `${p.sign} ${p.degree}° ${String(p.minute).padStart(2,'0')}′ · ${degrees(value)}`;}
function offset(value){const sign=value<0?'-':'+';value=Math.abs(value);return sign+[Math.floor(value/3600),Math.floor(value/60)%60,value%60].map(x=>String(x).padStart(2,'0')).join(':');}
export function mountSynastry(container,pair){
 container.innerHTML=`<div class="syn-heading"><div><span class="eyebrow">המפה של החיבור ביניכם</span><h2 id="syn-pair-title"></h2></div><span class="syn-tag">תצוגת מחקר · חישוב מקומי</span></div>
 <p class="syn-note">מפה מחושבת וניסיונית. הנחות הזמן ודיוק המנוע עדיין דורשים בדיקה לפני שימוש מקצועי. אין כאן פרשנות אוטומטית.</p>
 <div class="syn-grid"><article class="syn-panel syn-chart-panel"><div class="syn-toolbar"><h3>מפת סינסטרי כפולה</h3><button id="syn-download" type="button">הורדת המפה · SVG</button></div><div class="syn-zoom"><label for="syn-zoom">הגדלת המפה</label><input id="syn-zoom" type="range" min="100" max="200" step="25" value="100"><span>אפשר להגדיל ולגלול בנייד</span></div><p class="syn-muted">הנקודות בשפת הגלגל מציינות מיקום מדויק. סמלים צפופים מחוברים בקווי מנחה. מעלות ודקות מוצגות כאשר יש מקום; לבחירת פרטים מלאים לחצו על כוכב או השתמשו ב־Enter.</p><div class="syn-chart-scroll" tabindex="0" aria-label="מפת סינסטרי ניתנת לגלילה"><div id="syn-chart"></div></div></article>
 <aside class="syn-panel"><h3>שני הגלגלים</h3><div id="syn-summaries"></div><h3>מפתח ההיבטים</h3><div id="syn-legend"></div><details><summary>הנחות החישוב</summary><div id="syn-profile"></div><p class="syn-muted">ההמרה משתמשת ב־IANA מלא. קואורדינטות חיפוש העיר הן מרכז היישוב, ויש לאמת את המקום וההיסטוריה של אזור הזמן לפי הצורך.</p></details></aside></div>
 <article class="syn-panel"><div class="syn-toolbar"><div><h3>טבלת היבטים</h3><p id="syn-aspect-count"></p></div><label for="syn-filter">סינון היבט <select id="syn-filter"><option value="all">כל ההיבטים</option></select></label></div><p class="syn-muted">צמידות ומולות עד 8°, ריבוע ומשולש עד 6°, משושה עד 4°. ≈ מציין קרבה לגבול האורב, שבו אי־ודאות החישוב עשויה לשנות סיווג.</p><div class="syn-table-scroll"><table><caption class="sr-only">היבטים בין שני האנשים בלבד</caption><thead><tr><th>אדם ראשון</th><th>היבט</th><th>אדם שני</th><th>מרחק זוויתי</th><th>אורב</th><th>בחירה</th></tr></thead><tbody id="syn-aspects"></tbody></table></div><p class="syn-muted">לחצו על הדגשה לבחירת קו במפה. האורבים מחושבים ומוצגים בשש ספרות עשרוניות; מספר הספרות אינו מבטיח דיוק פיזיקלי זהה. בנייד אפשר לגלול את הטבלה לצדדים.</p></article>
 <div id="syn-position-tables"></div><article class="syn-panel"><h3>צירים וגבולות הבתים · Placidus</h3><p class="syn-muted">מזל, מעלה ודקה לכל גבול בית וציר. הדקות מעוגלות לדקה הקרובה, כולל מעבר מעלה ומזל; הערך העשרוני המדויק מופיע בפרטים.</p><details open><summary>12 הבתים וארבעת הצירים</summary><div class="syn-table-scroll"><table><thead><tr><th>בית / ציר</th><th id="syn-h0"></th><th id="syn-h1"></th></tr></thead><tbody id="syn-houses"></tbody></table></div></details></article>`;
 const $=id=>container.querySelector('#'+id),svg=renderChart(pair);$('syn-chart').append(svg);svg.setAttribute('role','group');
 // Keep exact marker locations; suppress only crowded degree text (details stay selectable).
 const degreeTexts=[...svg.querySelectorAll('[data-position-degree]')],occupied=[...svg.querySelectorAll('text:not([data-position-degree])')].map(n=>n.getBBox());
 const overlaps=(a,b)=>a.x<b.x+b.width+3&&a.x+a.width+3>b.x&&a.y<b.y+b.height+3&&a.y+a.height+3>b.y;
 for(const n of degreeTexts){const box=n.getBBox();if(occupied.some(b=>overlaps(box,b)))n.setAttribute('visibility','hidden');else occupied.push(box);}

 $('syn-pair-title').textContent=`${pair.charts.map(c=>c.name).join(' × ')} · ${pair.relationship}`;
 pair.charts.forEach((c,i)=>{
  const summary=text('section',undefined,'syn-person-summary');summary.style.borderColor=colors[i];
  summary.append(text('h4',`${c.name} · ${i?'גלגל חיצוני':'גלגל פנימי'}`),text('p',c.place),text('p',`${c.date} · ${c.time}`),text('p',`${c.utc} | UTC${offset(c.offsetSeconds)}`,'syn-number'),text('p',c.timeZone,'syn-number'),text('p',`ASC ${degrees(c.houses.asc)} · MC ${degrees(c.houses.mc)}`,'syn-number'));
  $('syn-summaries').append(summary);$(`syn-h${i}`).textContent=c.name;
 });
 $('syn-profile').append(text('p','גלגל טרופי · Placidus · Astronomy Engine 2.1.19 · IANA TZDB 2026b'),text('p',`הנחת DUT1=0; מודל ΔT: Espenak–Meeus. ΔT בשניות: ${pair.charts.map(c=>c.metadata.deltaTSeconds.toFixed(3)).join(' / ')}.`),text('p','המנוע אינו כולל הטיית אור כבידתית; זהו הבדל מהגדרות Swiss מסוימות. אין כירון, True Node או לילית אוסצולטורית. נקודות ממוצעות מוצגות רק אם נבחרו בטופס.'));
 for(const rule of aspectRules){
  const option=text('option',rule.label);option.value=rule.id;$('syn-filter').append(option);
  const item=text('p',`${rule.symbol} ${rule.label} · עד ${rule.orb}°`,'syn-legend-item');item.style.color=rule.color;$('syn-legend').append(item);
 }
 function tableRow(target,values){const row=text('tr');for(const [i,value] of values.entries()){const c=text(i===0?'th':'td',value,i?'syn-number':undefined);if(i===0)c.scope='row';row.append(c);}target.append(row);}
 for(let i=0;i<12;i++)tableRow($('syn-houses'),[`בית ${i+1}`,...pair.charts.map(c=>formatted(c.houses.cusps[i]))]);
 for(const a of ['asc','dsc','mc','ic'])tableRow($('syn-houses'),[a.toUpperCase(),...pair.charts.map(c=>formatted(c.houses[a]))]);
 const detailPanel=text('div','בחרו כוכב בגלגל בלחיצה או באמצעות Enter כדי לראות את פרטיו.','syn-point-detail');detailPanel.id='syn-point-detail';detailPanel.setAttribute('role','status');detailPanel.setAttribute('aria-live','polite');$('syn-chart').after(detailPanel);
 const motionLabel={direct:'ישיר',retrograde:'בנסיגה ℞',uncertain:'לא ודאי · סמוך לעמידה',unverified:'לא מאומת'};
 pair.charts.forEach((c,person)=>{
  const panel=text('article',undefined,'syn-panel'),heading=text('h3',`מיקומי כוכבים · ${c.name}`);heading.style.color=colors[person];panel.append(heading,text('p','הבית נקבע לפי אורך אקליפטי בין גבולות הבתים של האדם עצמו; זו אינה השמה תלת־ממדית. ≈ מציין מרחק עד דקת קשת מגבול בית.','syn-muted'));
  const scroll=text('div',undefined,'syn-table-scroll'),table=text('table'),caption=text('caption',`מיקומי הכוכבים של ${c.name}`,'sr-only'),head=text('thead'),hr=text('tr'),body=text('tbody');body.dataset.personPositions=person;
  for(const title of ['כוכב / נקודה','מזל','מעלה','דקה','בית','מצב נסיגה']){const th=text('th',title);th.scope='col';hr.append(th);}head.append(hr);table.append(caption,head,body);scroll.append(table);panel.append(scroll);$('syn-position-tables').append(panel);
  for(const point of c.points){
   const d=pointDetails(point,c);tableRow(body,[`${pointInfo[d.body][1]} ${pointInfo[d.body][0]}`,d.sign,`${d.degree}°`,`${String(d.minute).padStart(2,'0')}′`,`${d.house}${d.nearCusp?' ≈':''}`,motionLabel[d.motion]]);
   const row=body.lastElementChild;row.dataset.positionBody=d.body;row.title=`אורך מדויק ${degrees(d.longitude)}; בית ${d.house}`;
   const mark=svg.querySelector(`[data-person="${person}"][data-point="${point.body}"]`);
   mark.setAttribute('role','button');mark.setAttribute('tabindex','0');mark.setAttribute('aria-label',`${c.name}, ${pointInfo[d.body][0]}, ${formatted(d.longitude)}, בית ${d.house}, ${motionLabel[d.motion]}`);
   const select=()=>{for(const m of svg.querySelectorAll('[data-point]'))m.setAttribute('aria-pressed',String(m===mark));detailPanel.textContent=`${c.name} · ${pointInfo[d.body][0]} · ${formatted(d.longitude)} · בית ${d.house}${d.nearCusp?' (קרוב לגבול בית)':''} · ${motionLabel[d.motion]} · אורך מדויק ${degrees(d.longitude)}`;};
   mark.setAttribute('aria-pressed','false');mark.addEventListener('click',select);mark.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
  }
  panel.append(text('p','מצב הנסיגה נבדק מול Swiss באותו פרופיל חישוב, ללא הטיית אור כבידתית. סמוך לעמידה הסיווג אינו ודאי. זהו אימות במדגם, לא לכל רגע אפשרי.','syn-note'));
 });
 let selected=null;
 function highlight(id){
  selected=selected===id?null:id;
  for(const l of svg.querySelectorAll('[data-aspect-id]')){l.setAttribute('stroke-width',l.dataset.aspectId===selected?'4':'1.35');l.setAttribute('stroke-opacity',!selected?'.48':l.dataset.aspectId===selected?'1':'.13');}
  for(const row of $('syn-aspects').children){row.classList.toggle('selected',row.dataset.aspectId===selected);row.querySelector('button')?.setAttribute('aria-pressed',String(row.dataset.aspectId===selected));}
 }
 function aspects(){
  selected=null;highlight(null);$('syn-aspects').replaceChildren();const filter=$('syn-filter').value,items=pair.aspects.filter(a=>filter==='all'||a.type===filter);
  $('syn-aspect-count').textContent=`${items.length} היבטים מוצגים מתוך ${pair.aspects.length} · בין שני האנשים בלבד`;
  for(const a of items){
   const row=text('tr');row.dataset.aspectId=a.id;
   row.append(text('td',`${pointInfo[a.first][1]} ${pointInfo[a.first][0]}`));
   const aspect=text('td',`${a.symbol} ${a.label}`);aspect.style.color=a.color;row.append(aspect,text('td',`${pointInfo[a.second][1]} ${pointInfo[a.second][0]}`),text('td',degrees(a.separation),'syn-number'),text('td',`${degrees(a.orb)}${a.nearBoundary?' ≈':''}`,'syn-number'));
   const cell=text('td'),button=text('button','הדגשה');button.type='button';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`הדגשת ${pointInfo[a.first][0]} עם ${pointInfo[a.second][0]}, ${a.label}`);button.addEventListener('click',()=>highlight(a.id));cell.append(button);row.append(cell);$('syn-aspects').append(row);
  }
  if(!items.length){const row=text('tr'),cell=text('td','לא נמצאו היבטים בטווח שנבחר.');cell.colSpan=6;row.append(cell);$('syn-aspects').append(row);}
 }
 $('syn-filter').addEventListener('change',aspects);aspects();
 $('syn-zoom').addEventListener('input',()=>{$('syn-chart').style.width=`${$('syn-zoom').value}%`;});
 $('syn-download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='synastry-research.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}
