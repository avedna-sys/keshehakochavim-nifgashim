import {exportSVG,pngFile,pdfFile,downloadFile} from './chart-export.js';
export function attachChartExports(container,svg,pair){
 const $=id=>container.querySelector('#'+id),status=$('syn-export-status'),share=$('syn-share'),download=$('syn-export-download');
 const current=()=>svg.isConnected&&container.contains(svg);
 const message=text=>{status.textContent=text;};let readyPNG,preparation,fallbackURL;
 function clearFallback(){if(fallbackURL){URL.revokeObjectURL(fallbackURL);fallbackURL=undefined;}}
 const lifecycle=new MutationObserver(()=>{if(!current()){clearFallback();lifecycle.disconnect();}});lifecycle.observe(container,{childList:true,subtree:true});
 function savePNG(file){
  if(!current())return;downloadFile(file,file.name);clearFallback();fallbackURL=URL.createObjectURL(file);
  const link=document.createElement('a');link.href=fallbackURL;link.download=file.name;link.textContent='הורדת PNG ידנית';
  status.replaceChildren(document.createTextNode('המפה מוכנה ללא פרטי לידה מלאים. אם ההורדה לא החלה, לחצו כאן: '),link);
 }
 function prepare(){if(!preparation)preparation=exportSVG(svg,pair).then(async snapshot=>({snapshot,png:await pngFile(snapshot)})).catch(e=>{preparation=undefined;throw e;});return preparation;}
 // Prepare locally in advance so navigator.share is called directly within a user click.
 function warm(){share.disabled=true;share.textContent='מכין מפה לשיתוף…';prepare().then(v=>{readyPNG=v.png;if(current()){share.disabled=false;share.textContent='שתף מפה';}}).catch(()=>{if(current()){share.disabled=false;share.textContent='שתף מפה';}});}
 warm();
 $('syn-download').addEventListener('click',async()=>{try{const value=await exportSVG(svg,pair);if(current())downloadFile(new Blob([value.text],{type:'image/svg+xml;charset=utf-8'}),'synastry-research.svg');}catch{message('לא ניתן לייצא SVG כרגע. נסו שוב.');}});
 download.addEventListener('click',()=>{
  // Cached PNG must be dispatched in this click, before any await/activation loss.
  if($('syn-export-format').value==='png'&&readyPNG){savePNG(readyPNG);return;}
  download.disabled=true;message('מכין את המפה להורדה…');
  (async()=>{try{const {png}=await prepare();if(!current())return;readyPNG=png;
   if($('syn-export-format').value==='pdf'){const file=await pdfFile(png);if(!current())return;downloadFile(file,file.name);message('קובץ PDF מוכן, ללא פרטי לידה מלאים.');}
   else savePNG(png);
  }catch(e){if(current())message(e.message||'הייצוא נכשל. אפשר לנסות הורדת SVG.');}finally{if(current())download.disabled=false;}})();
 });
 share.addEventListener('click',()=>{
  if(!readyPNG){message('מכין קובץ לשיתוף. לאחר ההכנה לחצו שוב על ״שתף מפה״.');warm();return;}
  let supported=false;try{supported=Boolean(navigator.share&&navigator.canShare?.({files:[readyPNG]}));}catch{/* Some embedded browsers reject capability probes. */}
  if(!supported){message('שיתוף קבצים אינו נתמך בדפדפן הזה. לחצו על ״הורד מפה״, ואז צרפו את הקובץ ידנית ל־WhatsApp או ליישום אחר.');download.focus();return;}
  share.disabled=true;
  try{navigator.share({files:[readyPNG],title:'כשהכוכבים נפגשים'}).then(()=>{if(current())message('המפה הועברה לממשק השיתוף של המכשיר.');}).catch(e=>{if(current())message(e.name==='AbortError'?'השיתוף בוטל.':'לא ניתן לשתף את הקובץ. אפשר להוריד אותו ולצרף ידנית.');}).finally(()=>{if(current())share.disabled=false;});}
  catch{share.disabled=false;message('לא ניתן לפתוח שיתוף. הורידו את המפה וצרפו אותה ידנית.');}
 });
}
