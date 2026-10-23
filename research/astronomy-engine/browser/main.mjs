import './style.css';
import tzdbURL from '../data/tzdb-2026b.json?url';
import {createHistoricalTimeResolver} from '../historical-time.mjs';
import {calculateExperimentalSynastry,aspectRules,pointInfo} from '../synastry.mjs';
import {renderChart,colors} from './chart.mjs';
async function start(){
const response=await fetch(tzdbURL);
if(!response.ok)throw new Error('לא ניתן לטעון את מסד הזמן ההיסטורי.');
const tzdb=await response.json();
const resolver=createHistoricalTimeResolver(tzdb);
const $=id=>document.getElementById(id),form=$('birth-form');
const places=[['ירושלים · ישראל',31.7683,35.2137,'Asia/Jerusalem'],['אמסטרדם · הולנד',52.3676,4.9041,'Europe/Amsterdam'],['פריז · צרפת',48.8566,2.3522,'Europe/Paris'],['ניו יורק · ארצות הברית',40.7128,-74.006,'America/New_York'],['קטמנדו · נפאל',27.7172,85.324,'Asia/Kathmandu'],['לורד האו · אוסטרליה',-31.55,159.08,'Australia/Lord_Howe'],['אפיה · סמואה',-13.833,-171.75,'Pacific/Apia']];
const signNames=['טלה','שור','תאומים','סרטן','אריה','בתולה','מאזניים','עקרב','קשת','גדי','דלי','דגים'];
let current=null,selected=null;
for(let person=0;person<2;person++){
 const fieldset=document.createElement('fieldset');fieldset.className='person';
 fieldset.innerHTML=`<legend>${person===0?'אדם ראשון · גלגל פנימי':'אדם שני · גלגל חיצוני'}</legend><div class="fields">
 <label class="field wide">שם<input name="name${person}" maxlength="60" required autocomplete="off"></label>
 <label class="field">תאריך לידה<input type="date" name="date${person}" min="1800-01-01" max="2026-12-31" required></label>
 <label class="field">שעת לידה מקומית<input type="time" name="time${person}" step="1" required></label>
 <label class="field wide">מקום לידה<select name="place${person}"><option value="manual">הזנה ידנית של מקום ואזור זמן</option>${places.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('')}</select></label>
 <label class="field">קו רוחב<input type="number" name="latitude${person}" min="-90" max="90" step="any" required></label>
 <label class="field">קו אורך<input type="number" name="longitude${person}" min="-180" max="180" step="any" required></label>
 <label class="field wide">אזור זמן IANA<input class="zone" name="zone${person}" list="zones" required autocomplete="off" spellcheck="false"></label></div>`;
 $('people').append(fieldset);
 const select=form.elements[`place${person}`];
 select.addEventListener('change',()=>{if(select.value!=='manual'){const p=places[Number(select.value)];form.elements[`latitude${person}`].value=p[1];form.elements[`longitude${person}`].value=p[2];form.elements[`zone${person}`].value=p[3];}});
 for(const key of ['latitude','longitude','zone'])form.elements[key+person].addEventListener('input',()=>{select.value='manual';});
}
for(const zone of Object.keys(tzdb.zones).sort()){const o=document.createElement('option');o.value=zone;$('zones').append(o);}
for(const rule of aspectRules){
 const o=document.createElement('option');o.value=rule.id;o.textContent=rule.label;$('aspect-filter').append(o);
 const row=document.createElement('div');row.className='legend-row';
 const left=document.createElement('span'),stroke=document.createElement('span');stroke.className='legend-stroke';stroke.style.background=rule.color;left.append(stroke,`${rule.symbol} ${rule.label}`);
 const right=document.createElement('span');right.textContent=`עד ${rule.orb}°`;row.append(left,right);$('legend').append(row);
}
const formatDegrees=value=>`${value.toFixed(6)}°`;
function zodiac(value){const sign=Math.floor(value/30);return `${signNames[sign]} ${(value-sign*30).toFixed(4)}°`;}
function offset(s){const sign=s<0?'-':'+';s=Math.abs(s);return sign+[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');}
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function clear(){current=null;selected=null;$('results').hidden=true;$('chart').replaceChildren();$('aspect-rows').replaceChildren();}
form.addEventListener('input',()=>{clear();$('message').className='';$('message').textContent='הנתונים שונו. יש ליצור את המפה מחדש.';});
form.addEventListener('change',()=>{clear();$('message').className='';$('message').textContent='הנתונים שונו. יש ליצור את המפה מחדש.';});
function person(index){
 const f=form.elements,get=key=>f[key+index].value;
 return {name:get('name'),date:get('date'),time:get('time'),place:get('place')==='manual'?'קואורדינטות שהוזנו ידנית':places[Number(get('place'))][0],latitude:f[`latitude${index}`].valueAsNumber,longitude:f[`longitude${index}`].valueAsNumber,timeZone:get('zone').trim()};
}
function tableRow(parent,values){const row=node('tr');for(const [i,value] of values.entries()){const cell=node(i===0?'th':'td',value,i===0?'':'numeric');if(i===0)cell.scope='row';row.append(cell);}parent.append(row);}
function renderTables(){
 $('house-rows').replaceChildren();$('point-rows').replaceChildren();
 current.charts.forEach((c,i)=>{$(`house-name-${i}`).textContent=c.name;$(`point-name-${i}`).textContent=c.name;});
 for(let i=0;i<12;i++)tableRow($('house-rows'),[`בית ${i+1}`,...current.charts.map(c=>formatDegrees(c.houses.cusps[i]))]);
 for(const axis of ['asc','dsc','mc','ic'])tableRow($('house-rows'),[axis.toUpperCase(),...current.charts.map(c=>formatDegrees(c.houses[axis]))]);
 for(const p of current.charts[0].points)tableRow($('point-rows'),[`${pointInfo[p.body][1]} ${pointInfo[p.body][0]}`,...current.charts.map(c=>formatDegrees(c.points.find(q=>q.body===p.body).longitude))]);
}
function highlight(id){
 selected=selected===id?null:id;
 for(const l of $('chart').querySelectorAll('[data-aspect-id]')){l.setAttribute('stroke-width',l.dataset.aspectId===selected?'4':'1.35');l.setAttribute('stroke-opacity',!selected?'.48':l.dataset.aspectId===selected?'1':'.13');}
 for(const row of $('aspect-rows').children){row.classList.toggle('selected',row.dataset.aspectId===selected);row.querySelector('button')?.setAttribute('aria-pressed',String(row.dataset.aspectId===selected));}
}
function renderAspects(){
 $('aspect-rows').replaceChildren();
 const filter=$('aspect-filter').value,aspects=current.aspects.filter(a=>filter==='all'||a.type===filter);
 $('aspect-count').textContent=`${aspects.length} היבטים מוצגים מתוך ${current.aspects.length} · בין שני האנשים בלבד`;
 for(const a of aspects){
  const row=node('tr');row.dataset.aspectId=a.id;
  row.append(node('td',`${pointInfo[a.first][1]} ${pointInfo[a.first][0]}`));
  const type=node('td'),chip=node('span',`${a.symbol} ${a.label}`,'aspect-chip');chip.style.color=a.color;type.append(chip);row.append(type,node('td',`${pointInfo[a.second][1]} ${pointInfo[a.second][0]}`),node('td',formatDegrees(a.separation),'numeric'),node('td',`${formatDegrees(a.orb)}${a.nearBoundary?' ≈':''}`,'numeric'));
  const control=node('td'),button=node('button','הדגשה','highlight-button');button.type='button';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`הדגשת ${pointInfo[a.first][0]} עם ${pointInfo[a.second][0]}, ${a.label}`);button.addEventListener('click',()=>highlight(a.id));control.append(button);row.append(control);$('aspect-rows').append(row);
 }
 if(!aspects.length){const row=node('tr'),cell=node('td','לא נמצאו היבטים בטווח האורבים שנבחר.');cell.colSpan=6;row.append(cell);$('aspect-rows').append(row);}
 selected=null;for(const l of $('chart').querySelectorAll('[data-aspect-id]')){l.setAttribute('stroke-width','1.35');l.setAttribute('stroke-opacity','.48');}
}
function calculate(){
 clear();$('message').className='';
 try{
  if(!form.reportValidity())return;
  current=calculateExperimentalSynastry(person(0),person(1),resolver,{includeMeanNodes:form.elements.meanNodes.checked,includeMeanLilith:form.elements.meanLilith.checked});
  $('chart').replaceChildren(renderChart(current));$('pair-title').textContent=current.charts.map(c=>c.name).join(' × ');
  $('summaries').replaceChildren();
  current.charts.forEach((c,i)=>{
   const section=node('section',undefined,'person-summary');section.append(node('h4',`${c.name} · ${i?'חיצוני':'פנימי'}`),node('p',`${c.date} · ${c.time}`),node('p',c.place),node('p',`${c.utc} | UTC${offset(c.offsetSeconds)}`,'utc'),node('p',c.timeZone,'utc'),node('p',`ASC · ${zodiac(c.houses.asc)}`),node('p',`MC · ${zodiac(c.houses.mc)}`));$('summaries').append(section);
  });
  $('profile').replaceChildren(node('p',`טרופי · Placidus · IANA ${current.profile.tzdb}`),node('p',`ΔT בשניות: ${current.charts.map(c=>c.metadata.deltaTSeconds.toFixed(3)).join(' / ')}`),node('p','אין כירון, True Node או לילית אוסצולטורית. נקודות ממוצעות נוספות מופיעות רק אם נבחרו.'));
  $('aspect-filter').value='all';renderAspects();renderTables();$('results').hidden=false;
  $('message').textContent='המפה חושבה מהנתונים המוצגים. אין נתונים אסטרולוגיים מדומים.';
 }catch(error){clear();$('message').className='error';$('message').textContent=error instanceof RangeError?'לא ניתן לחשב: בדקו תאריך בשנים 1800–2026, שעה ידועה, קואורדינטות ומזהה IANA תקין. בתי Placidus אינם זמינים באזורי הקוטב.':error.message;}
}
form.addEventListener('submit',e=>{e.preventDefault();calculate();});
$('aspect-filter').addEventListener('change',()=>{if(current)renderAspects();});
$('zoom').addEventListener('input',()=>{$('chart').style.width=`${$('zoom').value}%`;});
$('download').addEventListener('click',()=>{
 const svg=$('chart').querySelector('svg');if(!svg)return;
 const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='synastry-experiment.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
function example(){
 const inputs=[{name:'אדם ראשון (בדיקה)',date:'1990-05-17',time:'09:30:00',place:0},{name:'אדם שני (בדיקה)',date:'1992-10-08',time:'18:45:00',place:1}];
 inputs.forEach((p,i)=>{for(const key of ['name','date','time','place'])form.elements[key+i].value=p[key];const location=places[p.place];form.elements['latitude'+i].value=location[1];form.elements['longitude'+i].value=location[2];form.elements['zone'+i].value=location[3];});
 calculate();$('message').textContent='מוצגים נתוני לידה לצורכי בדיקה בלבד. המיקומים וההיבטים חושבו בפועל; אפשר להחליף את הפרטים ולחשב מחדש.';
}
$('example').addEventListener('click',example);
example();

}
start().catch(error=>{document.getElementById('message').textContent='טעינת הניסוי נכשלה: '+error.message;document.getElementById('message').className='error';});
