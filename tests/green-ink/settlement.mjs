import assert from 'node:assert/strict';
import policies from './policies.mjs';
import { convene } from '../../runtime/minutes.mjs';

export function insureVerdict(charge, book = policies) {
  const receipt = convene(book, { charge, beneficiary: 'The owner of the green pixel' });
  assert.equal(receipt.hearings, 200, 'The jury box has a vacancy');
  assert.equal(receipt.settlement.contracts, 3200, 'Uninsured green ink');
  assert.ok(receipt.settlement.quarters.every(cents => cents > 0), 'Ink changed hands for free');
  return receipt;
}
