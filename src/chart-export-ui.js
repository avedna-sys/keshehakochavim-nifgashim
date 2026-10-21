import {exportSVG,pngFile,pdfFile,downloadFile} from './chart-export.js';
export function attachChartExports(container,svg,pair){
 const $=id=>container.querySelector('#'+id),status=$('syn-export-status'),share=$('syn-share'),download=$('syn-export-download');
 const current=()=>svg.isConnected&&container.contains(svg);
 const message=text=>{status.textContent=text;};let readyPNG,preparation,fallbackURL;const files=new Map(),pending=new Map();const formatSelect=$('syn-export-format');
 function clearFallback(){if(fallbackURL){URL.revokeObjectURL(fallbackURL);fallbackURL=undefined;}}
 const lifecycle=new MutationObserver(()=>{if(!current()){clearFallback();lifecycle.disconnect();}});lifecycle.observe(container,{childList:true,subtree:true});
 function saveFile(file,format){
  if(!current())return;downloadFile(file,file.name);clearFallback();fallbackURL=URL.createObjectURL(file);
  const link=document.createElement('a');link.href=fallbackURL;link.download=file.name;link.textContent=`הורדת ${format.toUpperCase()} ידנית`;
  status.replaceChildren(document.createTextNode('המפה מוכנה ללא פרטי לידה מלאים. אם ההורדה לא החלה, לחצו כאן: '),link);
 }
 function prepare(){if(!preparation)preparation=exportSVG(svg,pair).then(async snapshot=>({snapshot,png:await pngFile(snapshot)})).catch(e=>{preparation=undefined;throw e;});return preparation;}
 // Prepare locally in advance so navigator.share is called directly within a user click.
 function warm(){share.disabled=true;share.textContent='מכין מפה לשיתוף…';prepare().then(v=>{readyPNG=v.png;files.set('png',v.png);if(current()){share.disabled=false;share.textContent='שתף מפה';}}).catch(()=>{if(current()){share.disabled=false;share.textContent='שתף מפה';}});}
 warm();
 function fileFor(format){
  if(!['png','pdf','svg'].includes(format))return Promise.reject(Error('יש לבחור PNG, PDF או SVG.'));
  if(files.has(format))return Promise.resolve(files.get(format));
  if(!pending.has(format))pending.set(format,(async()=>{
   let file;
   if(format==='svg'){const value=await exportSVG(svg,pair);file=new File([value.text],'synastry-research.svg',{type:'image/svg+xml;charset=utf-8'});}
   else{const {png}=await prepare();readyPNG=png;files.set('png',png);file=format==='pdf'?await pdfFile(png):png;}
   files.set(format,file);return file;
  })().catch(e=>{pending.delete(format);throw e;}));
  return pending.get(format);
 }
 function downloadFormat(format){
  if(!current()||download.disabled)return;
  // Capture the requested format BEFORE any await; later selector changes cannot alter it.
  if(files.has(format)){saveFile(files.get(format),format);return;}
  download.disabled=true;message(`מכין ${format.toUpperCase()} להורדה…`);
  fileFor(format).then(file=>{if(current())saveFile(file,format);}).catch(e=>{if(current())message(e.message||'הייצוא נכשל. נסו שוב או בחרו SVG.');}).finally(()=>{if(current())download.disabled=false;});
 }
 formatSelect.addEventListener('change',()=>{
  const format=formatSelect.value;message(`נבחר ${format.toUpperCase()}. לחצו על ״הורד מפה״ להורדת הקובץ.`);
  // Preload locally so the next click can download synchronously with user activation.
  fileFor(format).catch(e=>{if(current()&&formatSelect.value===format)message(e.message||'לא ניתן להכין את הפורמט שנבחר. נסו שוב.');});
 });
 $('syn-download').addEventListener('click',()=>{
  if(files.has('svg')){saveFile(files.get('svg'),'svg');return;}
  message('מכין SVG להורדה…');fileFor('svg').then(file=>{if(current())saveFile(file,'svg');}).catch(()=>{if(current())message('לא ניתן לייצא SVG כרגע. נסו שוב.');});
 });
 download.addEventListener('click',()=>downloadFormat(formatSelect.value));
 share.addEventListener('click',()=>{
  if(!readyPNG){message('מכין קובץ לשיתוף. לאחר ההכנה לחצו שוב על ״שתף מפה״.');warm();return;}
  let supported=false;try{supported=Boolean(navigator.share&&navigator.canShare?.({files:[readyPNG]}));}catch{/* Some embedded browsers reject capability probes. */}
  if(!supported){message('שיתוף קבצים אינו נתמך בדפדפן הזה. לחצו על ״הורד מפה״, ואז צרפו את הקובץ ידנית ל־WhatsApp או ליישום אחר.');download.focus();return;}
  share.disabled=true;
  try{navigator.share({files:[readyPNG],title:'כשהכוכבים נפגשים'}).then(()=>{if(current())message('המפה הועברה לממשק השיתוף של המכשיר.');}).catch(e=>{if(current())message(e.name==='AbortError'?'השיתוף בוטל.':'לא ניתן לשתף את הקובץ. אפשר להוריד אותו ולצרף ידנית.');}).finally(()=>{if(current())share.disabled=false;});}
  catch{share.disabled=false;message('לא ניתן לפתוח שיתוף. הורידו את המפה וצרפו אותה ידנית.');}
 });
}
