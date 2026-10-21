import {exportSVG,pngFile,pdfFile,downloadFile} from './chart-export.js';
export function attachChartExports(container,svg,pair){
 const $=id=>container.querySelector('#'+id),status=$('syn-export-status'),share=$('syn-share'),download=$('syn-export-download');
 const current=()=>svg.isConnected&&container.contains(svg);
 const message=text=>{status.textContent=text;};let readyPNG,preparation;
 function prepare(){if(!preparation)preparation=exportSVG(svg,pair).then(async snapshot=>({snapshot,png:await pngFile(snapshot)})).catch(e=>{preparation=undefined;throw e;});return preparation;}
 // Prepare locally in advance so navigator.share is called directly within a user click.
 function warm(){share.disabled=true;share.textContent='מכין מפה לשיתוף…';prepare().then(v=>{readyPNG=v.png;if(current()){share.disabled=false;share.textContent='שתף מפה';}}).catch(()=>{if(current()){share.disabled=false;share.textContent='שתף מפה';}});}
 warm();
 $('syn-download').addEventListener('click',async()=>{try{const value=await exportSVG(svg,pair);if(current())downloadFile(new Blob([value.text],{type:'image/svg+xml;charset=utf-8'}),'synastry-research.svg');}catch{message('לא ניתן לייצא SVG כרגע. נסו שוב.');}});
 download.addEventListener('click',async()=>{
  download.disabled=true;message('מכין את המפה להורדה…');try{const {png}=await prepare();if(!current())return;const file=$('syn-export-format').value==='pdf'?await pdfFile(png):png;if(!current())return;downloadFile(file,file.name);message('קובץ המפה מוכן. הוא כולל שמות ומיקומי כוכבים, ללא תאריך, שעה, עיר או קואורדינטות לידה.');}catch(e){if(current())message(e.message||'הייצוא נכשל. אפשר לנסות הורדת SVG.');}finally{if(current())download.disabled=false;}
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
