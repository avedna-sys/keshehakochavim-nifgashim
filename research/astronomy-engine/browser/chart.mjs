import {normalize} from '../placidus.mjs';
import {pointInfo} from '../synastry.mjs';
const ns='http://www.w3.org/2000/svg';
export const colors=['#7152ad','#187f9b'];
const signs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const signColors=['#ae513b','#668147','#507ea4','#815ea8'];
export function position(longitude,radius,asc){const a=(longitude-asc+180)*Math.PI/180;return {x:500+radius*Math.cos(a),y:500-radius*Math.sin(a)};}
function el(tag,attributes={},text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attributes))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
function line(parent,a,b,attrs={}){const n=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,...attrs});parent.append(n);return n;}
function label(parent,point,text,attrs={}){const n=el('text',{x:point.x,y:point.y,'text-anchor':'middle','dominant-baseline':'middle',...attrs},text);parent.append(n);return n;}
function circle(parent,r,attrs={}){parent.append(el('circle',{cx:500,cy:500,r,fill:'none',...attrs}));}
function polygonPath(r1,r2,start,end,asc){const a=position(start,r2,asc),b=position(end,r2,asc),c=position(end,r1,asc),d=position(start,r1,asc);return `M ${a.x} ${a.y} A ${r2} ${r2} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${r1} ${r1} 0 0 1 ${d.x} ${d.y} Z`;}
// Labels may spread in a dense cluster; their source markers/leader-line anchors
// ALWAYS remain at the original calculated longitudes.
export function pointLabels(points,minGap=8){
 if(!points.length)return new Map();
 const sorted=points.map((p,index)=>({longitude:normalize(p.longitude),index})).sort((a,b)=>a.longitude-b.longitude);
 let cut=0,gap=-1;
 for(let i=0;i<sorted.length;i++){const g=normalize(sorted[(i+1)%sorted.length].longitude-sorted[i].longitude);if(g>gap){gap=g;cut=(i+1)%sorted.length;}}
 const ordered=[...sorted.slice(cut),...sorted.slice(0,cut)].map(p=>({...p}));
 for(let i=1;i<ordered.length;i++)while(ordered[i].longitude<ordered[i-1].longitude)ordered[i].longitude+=360;
 const place=items=>{const center=items.reduce((sum,p)=>sum+p.longitude,0)/items.length;return items.map((p,i)=>({...p,label:center+(i-(items.length-1)/2)*minGap}));};
 const groups=[];
 for(const p of ordered){groups.push([p]);while(groups.length>1){const a=groups[groups.length-2],b=groups[groups.length-1],pa=place(a),pb=place(b);if(pb[0].label-pa.at(-1).label>=minGap)break;groups.splice(-2,2,[...a,...b]);}}
 let labels=groups.flatMap(place);
 if(labels.length>1&&labels[0].label+360-labels.at(-1).label<minGap)labels=place(ordered);
 return new Map(labels.map(p=>[p.index,normalize(p.label)]));
}
export function renderChart(pair){
 const [first,second]=pair.charts,asc=first.houses.asc;
 const svg=el('svg',{xmlns:ns,viewBox:'0 0 1000 1000',role:'img','aria-labelledby':'chart-title chart-desc','font-family':'Arial, DejaVu Sans, sans-serif'});
 svg.append(el('title',{id:'chart-title'},`מפת סינסטרי ניסיונית: ${first.name} ו${second.name}`),el('desc',{id:'chart-desc'},'גלגל פנימי סגול לאדם הראשון וגלגל חיצוני תכלת לאדם השני. מיקומים מחושבים, בתי Placidus וקווי היבטים בין האנשים. פירוט מספרי בטבלאות שמתחת למפה.'));
 svg.append(el('rect',{width:1000,height:1000,rx:28,fill:'#fffdf8'}));
 label(svg,{x:500,y:35},'כשהכוכבים נפגשים',{fill:'#262236','font-size':27,'font-weight':700});
 label(svg,{x:500,y:67},`${first.name} · פנימי`,{fill:colors[0],'font-size':20});
 label(svg,{x:500,y:94},`${second.name} · חיצוני`,{fill:colors[1],'font-size':20});
 circle(svg,400,{fill:'#f9f4e7',stroke:'#c5b58b','stroke-width':1.4});
 circle(svg,365,{fill:'#f2f9fa',stroke:'#d4d9d6'});
 circle(svg,305,{fill:'#faf7fc',stroke:'#dce1e5'});
 circle(svg,276,{fill:'#faf4e8',stroke:'#c5b58b'});
 circle(svg,242,{fill:'#fbf8fc',stroke:'#d4d0df'});
 circle(svg,174,{fill:'#f4f1f8',stroke:'#dbd2e7'});
 circle(svg,143,{fill:'#fffdf8',stroke:'#d8d8d1'});
 for(const [r1,r2] of [[242,276],[365,400]]){
  for(let i=0;i<12;i++){
   svg.append(el('path',{d:polygonPath(r1,r2,i*30,(i+1)*30,asc),fill:signColors[i%4],'fill-opacity':.065,stroke:'#c6bfae','stroke-width':.65}));
   label(svg,position(i*30+15,(r1+r2)/2,asc),signs[i],{'font-size':29,fill:signColors[i%4]});
  }
  for(let d=0;d<360;d++){const len=d%10===0?7:d%5===0?5:2.5;line(svg,position(d,r2-len,asc),position(d,r2,asc),{stroke:'#69665e','stroke-width':d%5===0?.8:.4});}
 }
 pair.charts.forEach((c,person)=>{
  const range=person?[281,357]:[144,236],numberR=person?292:155;
  for(let i=0;i<12;i++){
   const cusp=c.houses.cusps[i],next=c.houses.cusps[(i+1)%12];
   const spoke=line(svg,position(cusp,range[0],asc),position(cusp,range[1],asc),{stroke:colors[person],'stroke-opacity':.38,'stroke-width':.9,'data-house':i+1,'data-person':person,'data-longitude':cusp});
   spoke.append(el('title',{},`${c.name} · בית ${i+1}: ${cusp.toFixed(6)}°`));
   label(svg,position(cusp+normalize(next-cusp)/2,numberR,asc),String(i+1),{fill:colors[person],'font-size':16,'font-weight':700});
  }
  const axes=[['ASC',c.houses.asc],['DSC',c.houses.dsc],['MC',c.houses.mc],['IC',c.houses.ic]];
  for(const [axis,longitude] of axes){
   line(svg,position(longitude,range[0],asc),position(longitude,range[1]+3,asc),{stroke:colors[person],'stroke-width':2.2,'data-axis':axis,'data-person':person,'data-longitude':longitude});
   const where=position(longitude,person?310:180,asc);
   label(svg,where,axis,{fill:colors[person],'font-size':15,'font-weight':700,stroke:'#fffdf8','stroke-width':4,'paint-order':'stroke'});
  }
 });
 const aspectGroup=el('g',{'data-layer':'aspects'});svg.append(aspectGroup);
 for(const a of pair.aspects){
  const path=line(aspectGroup,position(a.firstLongitude,126,asc),position(a.secondLongitude,139,asc),{stroke:a.color,'stroke-width':1.35,'stroke-opacity':.48,'data-aspect-id':a.id,'data-type':a.type,'stroke-dasharray':a.type==='opposition'?'5 3':a.type==='sextile'?'3 3':'none'});
  path.append(el('title',{},`${pointInfo[a.first][0]} – ${pointInfo[a.second][0]}: ${a.label}, אורב ${a.orb.toFixed(6)}°`));
 }
 pair.charts.forEach((c,person)=>{
  const labels=pointLabels(c.points),radius=person?333:208;
  c.points.forEach((p,i)=>{
   const labelLongitude=labels.get(i),where=position(labelLongitude,radius,asc),tick=position(p.longitude,person?359:239,asc);
   const g=el('g',{'data-point':p.body,'data-person':person,'data-longitude':p.longitude,'data-label-longitude':labelLongitude});
   line(g,tick,where,{stroke:colors[person],'stroke-width':.8,'stroke-opacity':.55});
   g.append(el('circle',{cx:tick.x,cy:tick.y,r:2.2,fill:colors[person]}));
   g.append(el('circle',{cx:where.x,cy:where.y,r:13,fill:'#fffdf8','fill-opacity':.94}));
   label(g,where,pointInfo[p.body][1],{fill:colors[person],'font-size':28,'font-weight':600});
   g.append(el('title',{},`${c.name} · ${pointInfo[p.body][0]}: ${p.longitude.toFixed(6)}° (${p.sign})`));
   svg.append(g);
  });
 });
 label(svg,{x:500,y:935},'סגול · אדם ראשון     |     תכלת · אדם שני',{fill:'#332d43','font-size':19});
 label(svg,{x:500,y:965},'טרופי · Placidus · Astronomy Engine · ניסוי בלבד',{fill:'#5b5663','font-size':16});
 return svg;
}
