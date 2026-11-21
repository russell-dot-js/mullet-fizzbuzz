const test = require('node:test');
const assert = require('node:assert/strict');

test('the lottery sells one ticket to each of three rival benches', async () => {
  const { drawBench } = await import('../land-court.mjs');
  const winners = [0, 1, 2].map(ticket => drawBench(count => {
    assert.equal(count, 3);
    return ticket;
  }));
  assert.deepEqual(winners, ['registry', 'queue', 'auction']);
});

test('every bench honors vacancies, sole ownership, ties and the Monday addendum', async () => {
  const { adjudicate, benchNames } = await import('../land-court.mjs');
  const claims = [
    { tenant: 'A', accepted: true, easement: 5, covenant: 'A owns it' },
    { tenant: 'B', accepted: true, easement: 3 },
    { tenant: 'C', accepted: true, easement: 5 },
    { tenant: 'D', accepted: false, easement: 1 },
  ];
  for (const bench of benchNames) {
    for (const [surveys, original, amended] of [
      [[], '15', '15'], [[claims[3]], '15', '15'], [[claims[0]], 'A', 'A'], [claims, 'BAC', 'CAB'],
    ]) {
      Object.freeze(surveys);
      assert.equal(adjudicate(15, surveys, 'chartered', bench).signage, original);
      assert.equal(adjudicate(15, surveys, 'restated', bench).signage, amended);
    }
  }
});

test('changing benches leaves the entire public deed intact', () => {
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const cli = path.join(__dirname, '../app.mjs');
  let precedent;
  for (const bench of ['registry', 'queue', 'auction']) {
    const minutes = execFileSync(process.execPath, [cli, '--case', '15', '--minutes', '--bench', bench],
      { encoding: 'utf8' });
    const allocation = 'Presiding bench: ' + bench + '\n';
    assert.ok(minutes.includes(allocation));
    assert.ok(minutes.endsWith('Authorized roadside sign: FizzBuzz\n'));
    const deed = minutes.replace(allocation, '');
    if (precedent !== undefined) assert.equal(deed, precedent);
    precedent = deed;
  }
});
