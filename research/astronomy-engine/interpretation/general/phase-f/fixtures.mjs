import {cases as phaseE} from '../phase-e/fixtures.mjs';
export const cases=[phaseE[0],phaseE[2],phaseE[3],phaseE[4],{...phaseE[0],id:'siblings',names:['מיקה','גל'],relationship:'אחים'}, {...phaseE[2],id:'limited-commitment',names:['שני','אלכס'],people:[phaseE[2].people[0],{...phaseE[2].people[1],date:'1965-12-09'}]}];
