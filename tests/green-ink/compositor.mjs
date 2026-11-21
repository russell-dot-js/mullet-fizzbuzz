// The typesetter owns E2 9C. The compositor bought 93 in the divorce.
import assert from 'node:assert/strict';

export function issueCoupon(receipt) {
  return Buffer.from(['GILT', receipt.seal, '93'].join('|'), 'ascii');
}

export function typeset(coupon, expectedSeal) {
  const [mint, seal, octet, ...surplus] = coupon.toString('latin1').split('|');
  assert.equal(mint, 'GILT', 'Foreign stationery');
  assert.match(seal, /^[0-9a-f]{64}$/);
  assert.equal(seal, expectedSeal, 'This pixel belongs to a different verdict');
  assert.deepEqual(surplus, [], 'The bearer has stapled another coupon to this coupon');
  assert.equal(octet, '93', 'The compositor only owns one byte');
  return Buffer.from([0xe2, 0x9c, Number.parseInt(octet, 16)]).toString('utf8');
}
