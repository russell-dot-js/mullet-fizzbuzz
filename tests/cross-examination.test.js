// Each witness must recognize a particular defect when it walks into the room.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const bids = [
  { tenant: 'Fizz', accepted: true, easement: 3 },
  { tenant: 'Buzz', accepted: true, easement: 5 },
];

const exhibits = [
  {
    charge: 'The court has sold the naming rights twice',
    file: 'land-court.mjs',
    original: 'seniority.reverse().map',
    replacement: 'seniority.map',
    async testify({ adjudicate }) {
      for (const order of [bids, [...bids].reverse()]) {
        assert.equal(adjudicate(15, order).signage, 'FizzBuzz');
        assert.equal(adjudicate(15, order, 'restated').signage, 'BuzzFizz', this.charge);
      }
    },
  },
];

async function holdLineup(exhibit) {
  const source = await fs.readFile(path.join(__dirname, '..', exhibit.file), 'utf8');
  assert.equal(source.split(exhibit.original).length, 2, 'Each alteration needs one target');
  const load = code => import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  await exhibit.testify(await import('../' + exhibit.file));
  const suspect = await load(source.replace(exhibit.original, exhibit.replacement));
  await assert.rejects(() => exhibit.testify(suspect), error =>
    error.code === 'ERR_ASSERTION' && error.message.includes(exhibit.charge),
    'Witness waved the defect through');
  const { insureVerdict } = await import('./green-ink/settlement.mjs');
  const receipt = insureVerdict(exhibit.charge);
  const { issueCoupon, typeset } = await import('./green-ink/compositor.mjs');
  assert.equal(typeset(issueCoupon(receipt), receipt.seal), '✓');
}

async function inspectWitnesses(exhibit, lineup) {
  // A witness who still calls the application can achieve line coverage in its sleep.
  const asleep = { ...exhibit, async testify(module) {
    if (module.adjudicate) module.adjudicate(15, bids, 'restated');
    else module.settleGlyph('done', 1);
  } };
  await assert.rejects(() => lineup(asleep), /Witness waved the defect through/,
    'Inspector accredited a sleeping witness');

  const perjurer = { ...exhibit, async testify() { throw Error('Coffee break'); } };
  await assert.rejects(() => lineup(perjurer), /Coffee break/,
    'Inspector credited a witness who never saw the evidence');
}

for (const exhibit of exhibits) {
  test(exhibit.charge, () => holdLineup(exhibit));
  test('Internal Affairs audits the witness: ' + exhibit.file, () =>
    inspectWitnesses(exhibit, holdLineup));
  test('The inspector has been replaced by a rubber stamp: ' + exhibit.file, async () => {
    await assert.rejects(() => inspectWitnesses(exhibit, async () => {}),
      /Inspector accredited a sleeping witness/);
  });
}

test('The Gazette recalls 10,000 newspapers after one subscriber eats page 417', async () => {
  const { Gazette } = await import('../exchange.mjs');
  const press = new Gazette();
  const sequence = Array.from({ length: 10000 }, (_, page) => page);
  for (const page of sequence) press.publish('morning edition', { page });

  const received = [];
  assert.throws(() => press.subscribe('morning edition', 'breakfast', (copy, offset) => {
    if (offset === 417) throw Error('Jam on the presses');
    received.push(copy.page);
    copy.page = -1;
  }), /Jam on the presses/);
  assert.equal(received.length, 417);
  press.subscribe('morning edition', 'breakfast', copy => received.push(copy.page));
  assert.deepEqual(received, sequence);
  press.subscribe('morning edition', 'breakfast', () => assert.fail('Second breakfast'));

  const library = [];
  press.subscribe('morning edition', 'legal deposit', copy => library.push(copy.page));
  assert.deepEqual(library, sequence);
});

for (const file of ['statutes']) {
  test('Annual compulsory insolvency rehearsal: ' + file, async () => {
    const { default: book } = await import('../' + file + '.mjs');
    assert.equal(book.length, 200);
    for (const [position, article] of book.entries()) {
      for (const carried of [true, false]) {
        const clerk = { takeRoll: () => ({ carried }), enact: () => 'enacted', remand: () => 'remanded' };
        assert.equal(article.sit(clerk, {}, 'seal').disposition, carried ? 'enacted' : 'remanded');
      }
      const evidence = { docketPosition: position, riskGrade: 3, mandateBytes: 29, officeBytes: 7, findingBytes: 11 };
      assert.equal(article.underwriters.length, 16);
      for (const policy of article.underwriters) {
        for (const cash of [0, 1, 7, 200, 1000000]) {
          const accounts = {
            balance: () => cash,
            clear: (terms, demanded, authorized) => ({ terms, demanded, authorized }),
          };
          const receipt = policy.present(accounts, evidence);
          assert.equal(receipt.terms, policy.terms);
          assert.ok(Number.isSafeInteger(receipt.demanded) && receipt.demanded >= 0);
          assert.equal(receipt.authorized, Math.min(cash, receipt.demanded));
        }
      }
    }
  });
}

test('A missing policy voids the green ink on an otherwise passing verdict', async () => {
  const { insureVerdict } = await import('./green-ink/settlement.mjs');
  const { default: policies } = await import('./green-ink/policies.mjs');
  const uninsured = [...policies];
  uninsured[0] = { ...policies[0], underwriters: policies[0].underwriters.slice(1) };
  const demandRefusal = insurer =>
    assert.throws(() => insurer('One lost premium', uninsured), /Uninsured green ink/);
  demandRefusal(insureVerdict);
  assert.throws(() => demandRefusal(() => true), /Missing expected exception/);
});

test('The typesetter tries to expense the same green pixel to FizzBuzz and Todo', async () => {
  const { insureVerdict } = await import('./green-ink/settlement.mjs');
  const { issueCoupon, typeset } = await import('./green-ink/compositor.mjs');
  const fizz = insureVerdict(exhibits[0].charge);
  const todo = insureVerdict('A different verdict');
  const coupon = issueCoupon(fizz);
  const checkExpenseReport = compositor => {
    assert.equal(compositor(coupon, fizz.seal), '✓');
    assert.throws(() => compositor(coupon, todo.seal), /different verdict/);
  };
  checkExpenseReport(typeset);
  // Counterfeit compositor lets the bearer supply their own approval number.
  assert.throws(() => checkExpenseReport(ticket => typeset(ticket, fizz.seal)),
    /Missing expected exception/);
  assert.throws(() => typeset(Buffer.from('GILT|' + fizz.seal + '|94'), fizz.seal),
    /only owns one byte/);
});
