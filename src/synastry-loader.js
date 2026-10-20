import dataURL from '../research/astronomy-engine/data/tzdb-2026b.json?url';
let pending;
export function loadSynastry(){
 if(!pending)pending=Promise.all([
  import('./synastry-integration.js'),
  import('../research/astronomy-engine/historical-time.mjs'),
  fetch(dataURL).then(r=>{if(!r.ok)throw new Error('לא ניתן לטעון את מסד הזמן ההיסטורי. נסו שוב.');return r.json();}),
  import('./synastry-view.js'),
 ]).then(([integration,time,data,view])=>({...integration,resolver:time.createHistoricalTimeResolver(data),...view})).catch(error=>{pending=undefined;throw error;});
 return pending;
}
