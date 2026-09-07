/**
 * Creates the IndexNow key and the file that proves ownership of it.
 *
 * IndexNow does not use the Bing Webmaster API key and needs no account. You invent a key, host it
 * as a plain text file at the site root whose filename is the key, and then POST changed URLs to
 * api.indexnow.org. The search engine fetches the file to confirm you control the host. One call
 * reaches Bing, Yandex, Seznam and Naver.
 *
 * The key is written to data/indexnow.json and committed, because it has to stay stable: changing
 * it invalidates every previous submission and means hosting a new file. This script therefore
 * REFUSES to overwrite an existing key unless --rotate is passed, which is the only situation where
 * losing the old one is intended.
 *
 * Nothing here talks to the network. Submission is scripts/submit_indexnow.cjs.
 *
 * Usage: node scripts/build_indexnow_key.cjs [--rotate]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, 'data', 'indexnow.json');
const ROTATE = process.argv.includes('--rotate');

let state = {};
try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { state = {}; }

if (state.key && !ROTATE) {
  console.log('key already exists: ' + state.key);
  console.log('hosted at /' + state.key + '.txt');
  const f = path.join(ROOT, state.key + '.txt');
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, state.key + '\n');
    console.log('  key file was missing and has been rewritten');
  }
  console.log('\nnothing to do. Pass --rotate only if you intend to invalidate the existing key.');
  process.exit(0);
}

if (state.key && ROTATE) {
  const old = path.join(ROOT, state.key + '.txt');
  if (fs.existsSync(old)) { fs.unlinkSync(old); console.log('removed old key file /' + state.key + '.txt'); }
}

// IndexNow accepts 8 to 128 characters of [a-zA-Z0-9-]. 32 hex characters is well inside that and
// has no ambiguity about case or encoding in a filename.
const key = crypto.randomBytes(16).toString('hex');
fs.writeFileSync(path.join(ROOT, key + '.txt'), key + '\n');

state.key = key;
state.keyLocation = 'https://thenomadhq.com/' + key + '.txt';
state.host = 'thenomadhq.com';
state._meta = {
  what: 'IndexNow key and submission state. The key must not change: rotating it invalidates prior submissions.',
  protocol: 'https://www.indexnow.org/documentation',
  generated: new Date().toISOString().slice(0, 10),
};
fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');

console.log('key:         ' + key);
console.log('key file:    /' + key + '.txt');
console.log('state:       data/indexnow.json');
console.log('\nThe key file must be live on the site before any submission is accepted, so deploy');
console.log('before running scripts/submit_indexnow.cjs.');
