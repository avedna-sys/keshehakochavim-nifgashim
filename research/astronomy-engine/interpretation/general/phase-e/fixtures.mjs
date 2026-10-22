// Synthetic fixtures only; never personal birth records.
import {controlPeople} from '../../control-fixtures.mjs';
export const cases=[
 {id:'couple-1',names:['אור','טל'],people:controlPeople[0],relationship:'זוגיות'},
 {id:'couple-2',names:['נעם','שחר'],people:controlPeople[1],relationship:'זוגיות'},
 {id:'couple-sparse',names:['ליאור','אופיר'],people:[controlPeople[0][0],controlPeople[2][1]],relationship:'זוגיות'},
 {id:'friendship',names:['דנה','רון'],people:controlPeople[1],relationship:'חברות'},
 {id:'family',names:['יעל','איתן'],people:controlPeople[2],relationship:'הורה וילד',roles:['child','parent']},
];
