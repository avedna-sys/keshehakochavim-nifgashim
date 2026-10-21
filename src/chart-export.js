import {pointInfo} from '../research/astronomy-engine/synastry.mjs';
import {zodiacParts} from '../research/astronomy-engine/position-details.mjs';
const ns='http://www.w3.org/2000/svg';
export const exportWidth=3000;
function node(tag,attrs={},content){const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(content!==undefined)n.textContent=content;return n;}
/** Export calculated SVG only, never the page, birth forms or full pair object. */
export async function exportSVG(svg,pair){
 await document.fonts?.ready;
 const copy=svg.cloneNode(true),rows=Math.max(...pair.charts.map(c=>c.points.length)),height=1120+rows*26;
 copy.setAttribute('viewBox',`0 0 1000 ${height}`);copy.setAttribute('width','1000');copy.setAttribute('height',String(height));copy.setAttribute('role','img');
 copy.querySelector('rect').setAttribute('height',String(height));
 for(const n of copy.querySelectorAll('script,foreignObject,image,a'))n.remove();
 for(const n of [copy,...copy.querySelectorAll('*')])for(const a of [...n.attributes])if(a.name.startsWith('on')||['tabindex','aria-pressed','style','href','xlink:href'].includes(a.name))n.removeAttribute(a.name);
 // Export every aspect at equal emphasis, regardless of current row/filter selection.
 for(const n of copy.querySelectorAll('[data-aspect-id]')){n.setAttribute('stroke-opacity','.48');n.setAttribute('stroke-width','1.35');}
 const header=node('text',{x:500,y:1010,'text-anchor':'middle','font-size':21,fill:'#332d43'},'מיקומי הכוכבים · מעלות ודקות בתוך המזל');copy.append(header);
 const fit=[];
 pair.charts.forEach((c,person)=>{
  const x=person?465:965,color=person?'#187f9b':'#7152ad';
  const title=node('text',{x,y:1048,'text-anchor':'start',direction:'rtl','font-size':20,fill:color},c.name);copy.append(title);fit.push([title,410]);
  c.points.forEach((p,i)=>{const z=zodiacParts(p.longitude),value=`${pointInfo[p.body][1]} ${pointInfo[p.body][0]} · ${z.sign} \u2066${z.degree}°${String(z.minute).padStart(2,'0')}′\u2069`;
   copy.append(node('text',{x,y:1080+i*26,'text-anchor':'start',direction:'rtl','font-size':17,fill:'#292431','data-export-position':p.body,'data-person':person},value));
  });
 });
 // Fit names without truncation; geometry remains in the original 1000x1000 plot.
 for(const n of copy.querySelectorAll(':scope > text'))if(n.getAttribute('y')==='67'||n.getAttribute('y')==='94')fit.push([n,900]);
 const holder=document.createElement('div');holder.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';holder.append(copy);document.body.append(holder);
 try{for(const [n,width]of fit){const measured=n.getComputedTextLength();if(measured>width)n.setAttribute('font-size',String(Number(n.getAttribute('font-size'))*width/measured));}
  return {text:new XMLSerializer().serializeToString(copy),height,width:1000,pointCount:pair.charts.reduce((n,c)=>n+c.points.length,0)};
 }finally{holder.remove();}
}
export function downloadFile(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export async function pngFile(snapshot){
 const url=URL.createObjectURL(new Blob([snapshot.text],{type:'image/svg+xml;charset=utf-8'}));
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=exportWidth;canvas.height=Math.round(exportWidth*snapshot.height/snapshot.width);const ctx=canvas.getContext('2d');if(!ctx)throw Error('לא ניתן ליצור תמונה בדפדפן הזה. אפשר להוריד SVG.');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(Error('לא ניתן ליצור PNG. אפשר להוריד SVG.')),'image/png'));return new File([blob],'synastry-map.png',{type:'image/png'});
 }finally{URL.revokeObjectURL(url);}
}
export async function pdfFile(png){
 const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.create();pdf.setTitle('כשהכוכבים נפגשים');pdf.setProducer('Keshehakochavim research export');
 const image=await pdf.embedPng(await png.arrayBuffer()),page=pdf.addPage([595.28,841.89]),scale=Math.min((595.28-40)/image.width,(841.89-40)/image.height),width=image.width*scale,height=image.height*scale;
 page.drawImage(image,{x:(595.28-width)/2,y:(841.89-height)/2,width,height});return new File([await pdf.save()],'synastry-map.pdf',{type:'application/pdf'});
}
