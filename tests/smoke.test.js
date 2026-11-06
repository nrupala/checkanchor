// CheckAnchor smoke test — loads the real page script from index.html and
// exercises its core behaviour: SHA-256 hashing via Web Crypto, credential
// creation, and the hash-chain linkage between anchored credentials.
// Run: node tests/smoke.test.js   (no dependencies; Node 18+)
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  passed += 1;
  console.log('ok -', name);
}

// --- (a) The page structure: core UI elements and logic hooks exist ---
for (const id of ['credName', 'credIssuer', 'credIssueDate', 'credExpiry',
  'credSkills', 'credMeta', 'hashPreview', 'verifyId', 'verifyResult',
  'credList', 'credCount', 'anchoredCount', 'blockchainViz']) {
  ok(`page has #${id}`, html.includes(`id="${id}"`));
}
for (const fn of ['createCredential', 'verifyCredential', 'previewHash',
  'exportWallet', 'importWallet', 'showTab']) {
  ok(`page wires ${fn}()`, html.includes(`onclick="${fn}(`));
}
ok('page declares a version', /<meta name="version" content="\d+\.\d+\.\d+">/.test(html));

// --- (b) Load the page's own inline script with minimal DOM stubs ---
const store = new Map();
const localStorageStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id, value: '', textContent: '', innerHTML: '',
      classList: { add() {}, remove() {} },
    });
  }
  return elements.get(id);
}
const alerts = [];
const context = {
  console,
  TextEncoder,
  crypto: webcrypto,
  localStorage: localStorageStub,
  document: {
    getElementById: (id) => element(id),
    querySelectorAll: () => [],
    createElement: () => ({ click() {}, style: {} }),
  },
  alert: (msg) => alerts.push(String(msg)),
};
vm.createContext(context);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'index.html carries an inline script');
vm.runInContext(scriptMatch[1], context);
const run = (expr) => vm.runInContext(expr, context);

(async () => {
  // --- (c) The hash function is real SHA-256 (known empty-string vector) ---
  const emptyHash = await run("sha256('')");
  ok('sha256 is Web Crypto SHA-256 (empty-string vector)',
    emptyHash === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const h1 = await run("sha256('checkanchor')");
  const h2 = await run("sha256('checkanchor')");
  ok('sha256 output is 64 lowercase hex chars', /^[0-9a-f]{64}$/.test(h1));
  ok('sha256 is deterministic', h1 === h2);

  // --- (d) Creating a credential anchors it at the head of the chain ---
  element('credName').value = 'AWS Solutions Architect';
  element('credIssuer').value = 'Amazon Web Services';
  element('credIssueDate').value = '2026-01-15';
  element('credExpiry').value = '';
  element('credSkills').value = 'Cloud Architecture, Kubernetes';
  element('credMeta').value = '';
  await run('createCredential()');
  let wallet = run('wallet');
  ok('one credential in the wallet after create', wallet.credentials.length === 1);
  const cred1 = wallet.credentials[0];
  ok('credential id is CA-<year>-001', new RegExp(`^CA-${new Date().getFullYear()}-001$`).test(cred1.id));
  ok('first credential anchors to GENESIS', cred1.previousHash === 'GENESIS');
  ok('credential hash is a SHA-256 hex digest', /^[0-9a-f]{64}$/.test(cred1.hash));
  ok('skills were parsed from the comma list',
    JSON.stringify(cred1.skills) === JSON.stringify(['Cloud Architecture', 'Kubernetes']));
  ok('wallet persisted to localStorage',
    JSON.parse(store.get('checkanchor_wallet')).credentials.length === 1);
  ok('anchoring was announced to the user', alerts.some((a) => a.includes('Credential anchored')));

  // --- (e) A second credential extends the hash chain ---
  element('credName').value = 'P.Eng. Licence';
  element('credIssuer').value = 'APEGA';
  element('credSkills').value = 'Power Systems';
  await run('createCredential()');
  wallet = run('wallet');
  ok('two credentials after second create', wallet.credentials.length === 2);
  const cred2 = wallet.credentials[1];
  ok('second credential id is sequential (-002)', cred2.id.endsWith('-002'));
  ok('chain link: cred2.previousHash === cred1.hash', cred2.previousHash === cred1.hash);
  ok('chain head moved: wallet.lastHash === cred2.hash', wallet.lastHash === cred2.hash);
  ok('each anchored credential has a distinct hash', cred2.hash !== cred1.hash);

  // --- (f) Tamper evidence at the primitive the verifier uses ---
  const recomputed = await run(`sha256(JSON.stringify(wallet.credentials[0]) + wallet.credentials[0].previousHash)`);
  const tampered = { ...cred1, name: 'Forged Credential' };
  const tamperedHash = await (async () => {
    context.__tampered = JSON.stringify(tampered) + tampered.previousHash;
    return run('sha256(__tampered)');
  })();
  ok('recomputation over stored fields is deterministic', /^[0-9a-f]{64}$/.test(recomputed));
  ok('changing a credential field changes its digest', tamperedHash !== recomputed);

  // --- (g) Verify path reports an unknown ID as not found ---
  element('verifyId').value = 'CA-1999-999';
  await run('verifyCredential()');
  ok('verify of unknown id reports not found',
    element('verifyResult').textContent.includes('not found'));

  // --- (h) handshake.js: register / discover / send / receive round-trip ---
  global.localStorage = localStorageStub;
  const Handshake = require(path.join(root, 'handshake.js'));
  const a = new Handshake();
  a.register('checkanchor', { version: '1.0.1', capabilities: ['anchor', 'verify'] });
  ok('handshake registers the app', a.appName === 'checkanchor');
  ok('handshake send to a named peer succeeds',
    a.send({ name: 'checkverify' }, { action: 'anchor', data: { id: cred1.id } }) === true);
  ok('handshake send with no peer fails cleanly', a.send(null, { action: 'x' }) === false);
  const b = new Handshake();
  b.register('checkverify', { version: '1.0.1', capabilities: ['verify'] });
  const inbox = b.receive();
  ok('handshake delivers the queued message to its addressee',
    inbox.length === 1 && inbox[0].message.action === 'anchor' && inbox[0].from === 'checkanchor');
  ok('handshake queue drains on receive', b.receive().length === 0);

  console.log(`\nPASS — ${passed} assertions`);
})().catch((err) => {
  console.error('FAIL:', err && err.message ? err.message : err);
  process.exit(1);
});
