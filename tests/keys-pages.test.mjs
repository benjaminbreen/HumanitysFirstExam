// Requires a completed Next.js production build. Uses isolated temporary entries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { harness } from './helpers/key-harness.mjs';

test('rendered HTML and RSC payloads enforce the study-wide reveal gate', { timeout: 60000 }, async () => {
  const h = harness();
  const port = 4387, base = `http://127.0.0.1:${port}`;
  const cookie = 'coder=ben.' + createHash('sha256').update('ben|saudade1|keys-page-test').digest('hex').slice(0, 32);
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(port), '--hostname', '127.0.0.1'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, KV_REST_API_URL: '', KV_REST_API_TOKEN: '', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', VERCEL: '', KEYS_DATA_DIR: path.join(h.temp, 'research/keys/entries'), CODING_SECRET: 'keys-page-test', KEYS_IMPORT_TOKEN: 'keys-import-test' },
  });
  let logs = '';
  server.stdout.on('data', b => { logs += b; }); server.stderr.on('data', b => { logs += b; });
  async function get(route, rsc = false, authenticated = true) {
    const response = await fetch(base + route, { headers: { ...(authenticated ? { Cookie: cookie } : {}), ...(rsc ? { RSC: '1' } : {}) } });
    const body = await response.text();
    assert.equal(response.status, 200, `${route}: ${response.status}`);
    return body;
  }
  const hidden = /HIDDEN_OPUS_CLAIM|HIDDEN_SOL_CLAIM|PRIVATE_EXPOSURE_|PRIVATE_SETTING_/;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { if ((await fetch(base + '/keys')).status === 200) { ready = true; break; } } catch { /* server starting */ }
      await new Promise(r => setTimeout(r, 150));
    }
    assert.equal(ready, true, logs);
    const progress = await get('/keys');
    assert.match(progress, /Opus 5\.5 \(Medium\)/);
    assert.match(progress, /GPT-6\.1 Sol \(Medium\)/);
    assert.doesNotMatch(progress, /Astra/);
    for (const human of ['ben', 'nathan']) await h.as(human, async () => {
      for (const p of h.model.pools) await h.keys.saveSorting(p.question, h.sorting(p.question), 0);
    });
    for (const agent of h.model.agents) {
      const receipt = await fetch(base + '/api/keys/agents', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer keys-import-test' }, body: JSON.stringify(h.run(agent)) });
      assert.equal(receipt.status, 200);
      assert.deepEqual(await receipt.json(), { recorded: true });
    }
    for (const route of ['/keys', '/keys/q01', '/keys/q01/agreement', '/keys/q01/reference', '/keys/q01/review', '/keys/q01/final', '/keys/q01/compare']) {
      assert.doesNotMatch(await get(route), hidden, route);
      assert.doesNotMatch(await get(route, true), hidden, route + ' RSC');
    }
    assert.match(await get('/keys/q01/agreement'), /The agents’ results stay hidden for now/);
    for (const p of h.model.pools.slice(0, 5)) await h.lockReference(p.question);
    assert.doesNotMatch(await get('/keys/q01/agreement'), hidden);
    assert.doesNotMatch(await get('/keys/q01/review', true), hidden);
    await h.lockReference(h.model.pools[5].question);
    assert.match(await get('/keys/q01/agreement'), /HIDDEN_OPUS_CLAIM/);
    const review = await get('/keys/q01/review');
    assert.match(review, /PRIVATE_EXPOSURE_sol/);
    assert.match(review, /gpt-6\.1-sol/);
    assert.match(review, /PRIVATE_SETTING_sol/);
    assert.doesNotMatch(await get('/keys/q01/review', false, false), hidden);
    const unauthorized = await fetch(base + '/api/keys/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(h.run('opus')) });
    assert.equal(unauthorized.status, 401);
    assert.doesNotMatch(await unauthorized.text(), hidden);
    assert.doesNotMatch(logs, /Cannot specify a "name" prop|Encountered two children with the same key|Internal Server Error/);
  } finally {
    server.kill('SIGTERM');
    if (server.exitCode === null) await once(server, 'exit');
    h.cleanup();
  }
});
