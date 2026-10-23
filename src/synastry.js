/**
 * BirthDetails: { name, date, time, place, country }, all strings.
 * Birth time is local civil time. A future engine must resolve coordinates,
 * historical timezone and DST before calculating astronomical positions.
 * This module validates input only; the research integration adapter calculates separately.
 */
export const relationshipTypes = ['זוגיות', 'הורה וילד', 'אחים', 'חברות', 'אחר'];
export function prepareRequest(first, second, relationship, today = new Date().toISOString().slice(0, 10)) {
  if (!relationshipTypes.includes(relationship)) throw new Error('יש לבחור סוג קשר.');
  for (const person of [first, second]) {
    if (['name', 'date', 'place', 'country'].some(key => !person[key]?.trim())) {
      throw new Error('יש למלא שם, תאריך לידה, מקום לידה ומדינה עבור שני המשתתפים.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(person.date) || Number.isNaN(Date.parse(person.date)) || new Date(person.date).toISOString().slice(0, 10) !== person.date || person.date > today) {
      throw new Error('יש להזין תאריך לידה תקין שאינו בעתיד.');
    }
    if (person.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(person.time)) {
      throw new Error('יש להזין שעת לידה תקינה או להשאיר את השדה ריק.');
    }
  }
  return { people: [first, second], relationship, status: 'in-development' };
}
