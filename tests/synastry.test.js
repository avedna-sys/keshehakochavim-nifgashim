import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRequest, relationshipTypes } from '../src/synastry.js';
const birth = { name: 'עדנה', date: '1990-01-01', time: '', place: 'חיפה', country: 'ישראל' };
test('accepts unknown birth time and all supported relationship types without producing calculations', () => {
  for (const type of relationshipTypes) {
    const request = prepareRequest(birth, { ...birth, name: 'אדם' }, type);
    assert.equal(request.status, 'in-development');
    assert.equal(request.people.length, 2);
    assert.equal('aspects' in request, false);
    assert.equal('chart' in request, false);
  }
});
test('rejects missing details for either participant', () => {
  for (const field of ['name', 'date', 'place', 'country']) {
    assert.throws(() => prepareRequest({ ...birth, [field]: '' }, birth, 'זוגיות'));
    assert.throws(() => prepareRequest(birth, { ...birth, [field]: ' ' }, 'זוגיות'));
  }
});
test('rejects invalid dates, future dates, invalid times and unknown relationships', () => {
  for (const date of ['not-a-date', '2023-02-30', '1990-13-01', '2099-01-01']) {
    assert.throws(() => prepareRequest({ ...birth, date }, birth, 'זוגיות', '2026-10-19'));
  }
  assert.throws(() => prepareRequest({ ...birth, time: '25:10' }, birth, 'זוגיות'));
  assert.throws(() => prepareRequest(birth, birth, 'unknown'));
});
