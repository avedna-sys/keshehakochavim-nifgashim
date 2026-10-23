import {Temporal} from '@js-temporal/polyfill';
import {findCountry} from './countries.js';
import {prepareRequest} from './synastry.js';
export const storageKey='keshehakochavim.birth-data.v1';
export const maxBackupBytes=128*1024;
const fail=()=>{throw new Error('נתוני הגיבוי אינם תקינים או שגרסת הקובץ אינה נתמכת. לא בוצע שינוי.');};
function string(value,max=250,optional=false){if(typeof value!=='string'||value.length>max||(!optional&&!value.trim()))fail();return value.trim();}
export function validateBirthData(raw){
 if(!raw||raw.format!=='keshehakochavim-birth-data'||raw.version!==1||!Array.isArray(raw.people)||raw.people.length!==2)fail();
 const people=raw.people.map(p=>{
  if(!p||!p.location)fail();
  const person=Object.fromEntries(['name','date','time','place','country'].map(k=>[k,string(p[k],k==='name'||k==='country'?100:250,k==='time')]));
  const l=p.location,country=findCountry(person.country);
  if(!country||country.code!==l.countryCode||!Number.isFinite(l.latitude)||Math.abs(l.latitude)>90||!Number.isFinite(l.longitude)||Math.abs(l.longitude)>180)fail();
  const timeZone=string(l.timeZone,100);try{Temporal.Now.zonedDateTimeISO(timeZone);}catch{fail();}
  if(!timeZone.includes('/'))fail();
  const location={id:string(l.id,100),name:string(l.name),region:string(l.region??'',250,true),countryCode:country.code,latitude:l.latitude,longitude:l.longitude,timeZone,source:string(l.source??'Imported location; verify before calculation',250)};
  return {...person,country:country.name,location};
 });
 prepareRequest(people[0],people[1],raw.relationship);
 return {format:'keshehakochavim-birth-data',version:1,people,relationship:raw.relationship,options:{includeMeanNodes:raw.options?.includeMeanNodes===true,includeMeanLilith:raw.options?.includeMeanLilith===true}};
}
export function parseBirthData(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>maxBackupBytes)fail();let value;try{value=JSON.parse(text);}catch{fail();}return validateBirthData(value);}
export function serializeBirthData(value){return JSON.stringify(validateBirthData(value),null,2);}
