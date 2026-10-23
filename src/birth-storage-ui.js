import {prepareRequest} from './synastry.js';
import {storageKey,maxBackupBytes,validateBirthData,parseBirthData,serializeBirthData} from './birth-storage.js';
export function attachBirthStorage(form,locations,invalidate){
 const panel=document.createElement('section');panel.className='birth-storage';panel.setAttribute('aria-labelledby','birth-storage-title');
 panel.innerHTML=`<h3 id="birth-storage-title">נתוני לידה שמורים</h3><p>שמירה מתבצעת רק בלחיצה על ״שמור נתוני לידה״, בדפדפן ובמכשיר הזה בלבד. הפרטים אינם נשלחים לשרת. במחשב משותף אנשים אחרים עשויים לגשת אליהם. חלון פרטי או ניקוי נתוני הדפדפן עלולים למחוק את השמירה.</p><div class="birth-storage-actions"><button type="button" id="birth-save">שמור נתוני לידה</button><button type="button" id="birth-load">טען נתונים שמורים</button><button type="button" id="birth-delete">מחק נתונים שמורים</button><button type="button" id="birth-export">ייצא גיבוי JSON</button><button type="button" id="birth-import">ייבא גיבוי JSON</button><input type="file" id="birth-import-file" accept=".json,application/json" hidden></div><p>ייבוא וטעינה ממלאים את הטפסים בלבד; לחצו על שמירה כדי לשמור אותם. קובץ גיבוי מכיל פרטים אישיים ללא הצפנה — שמרו אותו במקום פרטי. השמירה נפרדת בין כתובות Preview והאתר.</p><p id="birth-storage-status" role="status" aria-live="polite" tabindex="-1"></p>`;
 form.after(panel);const $=id=>panel.querySelector('#'+id),message=t=>{$('birth-storage-status').textContent=t;};
 function readForm(){
  const data=new FormData(form);const draft={format:'keshehakochavim-birth-data',version:1,people:['first','second'].map(id=>({...Object.fromEntries(['name','date','time','place','country'].map(k=>[k,String(data.get(`${id}-${k}`)||'')])),location:locations[id].getLocation()})),relationship:data.get('relationship'),options:{includeMeanNodes:data.has('mean-nodes'),includeMeanLilith:data.has('mean-lilith')}};
  prepareRequest(draft.people[0],draft.people[1],draft.relationship);
  if(draft.people.some(p=>!p.location))throw new Error('יש לבחור עיר מהרשימה עבור שני האנשים לפני שמירה או ייצוא, כדי לכלול קואורדינטות ואזור זמן.');
  return validateBirthData(draft);
 }
 function apply(value){
  // Validation completed before any form mutation. No geocoding or storage writes.
  invalidate();value.people.forEach((p,i)=>{const id=i?'second':'first';for(const k of ['name','date','time'])form.elements[`${id}-${k}`].value=p[k];locations[id].restoreLocation(p.location);});
  for(const radio of form.querySelectorAll('[name=relationship]'))radio.checked=radio.value===value.relationship;
  form.elements['mean-nodes'].checked=value.options.includeMeanNodes;form.elements['mean-lilith'].checked=value.options.includeMeanLilith;
 }
 function action(fn){try{fn();}catch(error){message(error.name==='QuotaExceededError'||error.name==='SecurityError'?'הדפדפן חסם את השמירה או שהאחסון מלא. הנתונים הקיימים לא נמחקו; אפשר לייצא גיבוי JSON.':error.message);}}
 try{message(localStorage.getItem(storageKey)!==null?'נמצאו נתונים שמורים. הם ייטענו רק בלחיצה על ״טען נתונים שמורים״.':'אין נתוני לידה שמורים עבור כתובת זו.');}catch{message('האחסון המקומי אינו זמין בדפדפן הזה. ייבוא וייצוא JSON עדיין זמינים.');}
 $('birth-save').addEventListener('click',()=>action(()=>{
  const value=serializeBirthData(readForm());if(localStorage.getItem(storageKey)!==null&&!confirm('להחליף את נתוני הלידה השמורים בנתונים שבטפסים? אפשר לייצא קודם גיבוי.'))return;
  localStorage.setItem(storageKey,value);message('נתוני הלידה נשמרו בדפדפן הזה. לא נשלחו לשרת.');
 }));
 $('birth-load').addEventListener('click',()=>action(()=>{
  const raw=localStorage.getItem(storageKey);if(raw===null){message('אין נתוני לידה שמורים לטעינה.');return;}const value=parseBirthData(raw);
  if(!confirm('לטעון את הנתונים השמורים במקום הפרטים הנוכחיים בטפסים?'))return;apply(value);message('הנתונים נטענו לטפסים, כולל הקואורדינטות ואזורי הזמן. יש ליצור את המפה מחדש.');
 }));
 $('birth-delete').addEventListener('click',()=>action(()=>{
  if(localStorage.getItem(storageKey)===null){message('אין נתוני לידה שמורים למחיקה.');return;}
  if(!confirm('למחוק את נתוני הלידה השמורים בדפדפן? הפרטים בטפסים וקובצי הגיבוי לא יימחקו.'))return;
  localStorage.removeItem(storageKey);message('הנתונים השמורים נמחקו. הטפסים וקובצי גיבוי שהורדו נשארו ללא שינוי.');
 }));
 $('birth-export').addEventListener('click',()=>action(()=>{
  const content=serializeBirthData(readForm()),url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='birth-data-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('נוצר קובץ גיבוי מהפרטים הנוכחיים בטפסים. לא בוצעה שמירה בדפדפן.');
 }));
 $('birth-import').addEventListener('click',()=>$('birth-import-file').click());
 $('birth-import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  try{if(file.size>maxBackupBytes)throw new Error('קובץ הגיבוי גדול מדי (עד 128KB). לא בוצע שינוי.');const value=parseBirthData(await file.text());
   if(!confirm('לייבא את הגיבוי במקום הפרטים הנוכחיים בטפסים? הייבוא אינו שומר בדפדפן; לשמירה נדרשת לחיצה נפרדת.'))return;
   apply(value);message('הגיבוי יובא לטפסים בלבד. לשמירה קבועה לחצו על ״שמור נתוני לידה״.');
  }catch(error){message(error.message||'לא ניתן לקרוא את קובץ הגיבוי. לא בוצע שינוי.');}
 });
}
