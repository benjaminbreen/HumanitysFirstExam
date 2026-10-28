import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { harness } from './helpers/key-harness.mjs';

test('shared sorting instructions match the procedure exactly', () => {
  const h = harness();
  try {
    const procedure = fs.readFileSync(path.join(__dirname, '../research/keys/PROCEDURE.md'), 'utf8');
    const quote = procedure.split('\n').filter(l => l.startsWith('>')).map(l => l.startsWith('> ') ? l.slice(2) : '').join('\n');
    assert.equal(quote, h.model.instructions.text);
  } finally { h.cleanup(); }
});
test('direction and argument grouping are distinct; Off is excluded from grouping', () => {
  const h = harness();
  try {
    const { model: m } = h;
    const ids = m.getPool('Q01').passages.map(p => p.id);
    const s = (groups) => ({ ...m.emptySorting(), categories: groups.map((g, i) => ({ id: 'c' + i, claim: 'x', reason: 'y', direction: 'yes', passages: g.map(j => ids[j]) })), unclear: ids.slice(4) });
    const a = s([[0, 1], [2, 3]]), b = s([[0, 2], [1, 3]]), c = s([[0, 1], [2], [3]]);
    assert.deepEqual([m.tally('Q01', a, b).same, m.tally('Q01', a, b).together, m.tally('Q01', a, b).either], [4, 0, 4]);
    assert.deepEqual([m.tally('Q01', a, c).together, m.tally('Q01', a, c).either], [1, 2]);
    const off = { ...m.emptySorting(), off: ids };
    const t = m.tally('Q01', off, off);
    assert.equal(t.same, ids.length); assert.equal(t.either, 0); assert.equal(t.groupingN, 0); assert.equal(t.groupingOff, ids.length);
    assert.equal(m.kappa(t.dirs), null);
  } finally { h.cleanup(); }
});
test('completion rejects missing arguments, duplicate assignments and unknown IDs', () => {
  const h = harness();
  try {
    const s = h.sorting('Q01');
    assert.equal(h.model.complete('Q01', s), true);
    s.categories[0].reason = ' ';
    assert.equal(h.model.complete('Q01', s), false);
    s.categories[0].reason = 'reason'; s.off.push('p01');
    assert.throws(() => h.model.validateSorting('Q01', s), /only once/);
    s.off = ['not-a-passage'];
    assert.throws(() => h.model.validateSorting('Q01', s), /only once/);
  } finally { h.cleanup(); }
});
for (const storage of ['file', 'redis']) test(`${storage}: all-six gates, no agent data before all human references lock`, async () => {
  const h = harness(storage);
  try {
    await h.as(null, () => assert.rejects(h.keys.dashboard(), /Sign in/));
    await h.as('ben', () => assert.rejects(h.keys.comparison('Q01'), /All four must finish/));
    await h.finishIndependent();
    let d = await h.as('ben', () => h.keys.dashboard());
    assert.equal(d.independentLocked, true); assert.equal(d.human, true); assert.equal(d.revealed, false);
    await assert.rejects(h.keys.saveSorting('Q01', h.sorting('Q01'), 1), /locked/);
    await assert.rejects(h.keys.importAgentRun(h.run('opus')), /already recorded/);
    assert.equal((await h.keys.comparison('Q01')).runs, null);
    await assert.rejects(h.keys.reviewFor('Q01'), /stay hidden/);
    for (const p of h.model.pools.slice(0, 5)) await h.lockReference(p.question);
    assert.equal((await h.keys.comparison()).runs, null);
    assert.equal((await h.keys.dashboard()).revealed, false);
    assert.doesNotMatch(JSON.stringify(await h.keys.dashboard()), /HIDDEN_|PRIVATE_EXPOSURE|PRIVATE_SETTING/);
    await assert.rejects(h.keys.jointFor('Q01', 'final'), /stay hidden/);
    await h.lockReference(h.model.pools[5].question);
    d = await h.keys.dashboard(); assert.equal(d.revealed, true);
    assert.match(JSON.stringify((await h.keys.comparison()).runs), /HIDDEN_OPUS_CLAIM/);
    await assert.rejects(h.keys.saveJoint('Q01', 'reference', h.sorting('Q01'), 1), /locked/);
    await assert.rejects(h.keys.startJoint('Q01', 'final', 'ben'), /definition reviews/);
    if (storage === 'redis') assert.ok(h.history.length > 5);
    else assert.ok(fs.readdirSync(path.join(h.temp, 'research/keys/entries/history')).length > 5);
  } finally { h.cleanup(); }
});
test('compare-and-set prevents lost edits and approvals of an unseen version', async () => {
  const h = harness();
  try {
    await h.finishIndependent();
    await h.keys.startJoint('Q01', 'reference', 'ben');
    await h.keys.approveJoint('Q01', 'reference', 1, true);
    const edits = await Promise.allSettled([
      h.keys.saveJoint('Q01', 'reference', h.sorting('Q01', 'First competing edit'), 1),
      h.keys.saveJoint('Q01', 'reference', h.sorting('Q01', 'Second competing edit'), 1),
    ]);
    assert.equal(edits.filter(x => x.status === 'fulfilled').length, 1);
    const ref = await h.keys.jointFor('Q01', 'reference');
    assert.equal(ref.version, 2); assert.deepEqual(ref.agreed, {});
    await h.as('nathan', () => assert.rejects(h.keys.approveJoint('Q01', 'reference', 1, true), /version has changed/));
    await Promise.all([
      h.as('ben', () => h.keys.approveJoint('Q01', 'reference', 2, true)),
      h.as('nathan', () => h.keys.approveJoint('Q01', 'reference', 2, true)),
    ]);
    assert.ok((await h.keys.jointFor('Q01', 'reference')).frozenAt);
    assert.equal((await h.keys.dashboard()).revealed, false);
  } finally { h.cleanup(); }
});
test('reviews require saved joint judgments, keep unresolved separate, and final keys preserve references', async () => {
  const h = harness();
  try {
    await h.finishIndependent();
    for (const p of h.model.pools) await h.lockReference(p.question);
    await h.as('ben', () => assert.rejects(h.keys.recordDecision('opus', 'use', 'Early decision'), /all definition reviews/));
    const before = JSON.stringify((await h.keys.reviewFor('Q01')).reference);
    for (const p of h.model.pools) for (const a of h.model.agents) {
      const r = h.review();
      await h.as('ben', () => h.keys.saveReview(p.question, a, r, 0));
      await h.as('ben', () => h.keys.approveReview(p.question, a, 1, true, r));
      if (p.question === 'Q01' && a === 'opus') {
        const dirty = { ...r, notes: 'Unsaved new interpretation' };
        await assert.rejects(h.keys.approveReview(p.question, a, 1, true, dirty), /Save your review changes/);
        const invalid = h.review(); invalid.categories.k1.status = 'unsupported';
        await assert.rejects(h.keys.saveReview(p.question, a, invalid, 1), /supported agent positions/);
      }
      await h.as('nathan', () => h.keys.approveReview(p.question, a, 1, true, r));
    }
    for (const a of h.model.agents) await h.as('ben', () => h.keys.recordDecision(a, 'inconclusive', 'Apply the saved rule; more fresh questions are needed.'));
    await h.keys.startJoint('Q01', 'final', 'ben');
    let final = await h.keys.jointFor('Q01', 'final');
    final.categories[0].note = 'A final-key note';
    final = await h.keys.saveJoint('Q01', 'final', final, 1);
    await h.as('ben', () => h.keys.approveJoint('Q01', 'final', 2, true));
    await h.as('nathan', () => h.keys.approveJoint('Q01', 'final', 2, true));
    assert.ok((await h.keys.jointFor('Q01', 'final')).frozenAt);
    assert.equal(JSON.stringify((await h.keys.reviewFor('Q01')).reference), before);
    const unresolved = h.model.emptyReview();
    const reviewData = await h.keys.reviewFor('Q01');
    const counts = h.model.reviewCounts('Q01', reviewData.reference, reviewData.runs.opus, unresolved);
    assert.equal(counts.missed, 0); assert.equal(counts.unresolved, 1); assert.equal(counts.agentUnresolved, 1);
  } finally { h.cleanup(); }
});
test('legacy human entries migrate as unfinished drafts; old final approvals and Claude drafts are not imported', async () => {
  const h = harness();
  try {
    const dir = path.join(h.temp, 'research/keys/entries'); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ben.json'), JSON.stringify({ Q01: h.sorting('Q01') }));
    fs.writeFileSync(path.join(dir, 'final.json'), JSON.stringify({ Q01: { ...h.sorting('Q01'), frozenAt: 'old' } }));
    const d = await h.keys.dashboard();
    assert.equal(d.status[0].mine.categories[0].claim, 'Human claim'); assert.equal(d.status[0].mine.done, false);
    assert.equal(d.agentReceived.opus, false); assert.equal(d.human, false);
    const state = await h.store.readStudy(); assert.deepEqual(state.references, {}); assert.deepEqual(state.finals, {});
  } finally { h.cleanup(); }
});
test('agent import rejects wrong provenance and repeated assignments without altering the original', async () => {
  const h = harness();
  try {
    const r = h.run('opus');
    await assert.rejects(h.keys.importAgentRun({ ...r, inputVersion: 'wrong' }), /provenance/);
    await assert.rejects(h.keys.importAgentRun({ ...r, agent: 'astra', model: 'gpt-6-astra' }), /provenance/);
    await assert.rejects(h.keys.importAgentRun({ ...r, model: 'claude-opus-5' }), /requires claude-opus-5-5/);
    for (const effort of [undefined, 'low', 'high', 'max', 'Medium']) {
      await assert.rejects(h.keys.importAgentRun({ ...r, settings: { effort } }), /medium effort/);
    }
    const sol = h.run('sol');
    await assert.rejects(h.keys.importAgentRun({ ...sol, model: 'gpt-6-sol' }), /requires gpt-6.1-sol/);
    await assert.rejects(h.keys.importAgentRun({ ...sol, settings: { effort: 'high' } }), /medium effort/);
    assert.deepEqual((await h.store.readStudy()).runs, {});
    const raw = JSON.parse(r.originalOutput); raw.Q01.categories[0].passages.push('p01');
    await assert.rejects(h.keys.importAgentRun({ ...r, originalOutput: JSON.stringify(raw) }), /only once/);
    await h.keys.importAgentRun(r);
    assert.equal((await h.store.readStudy()).runs.opus.originalOutput, r.originalOutput);
    assert.doesNotMatch(JSON.stringify(await h.keys.dashboard()), /HIDDEN_|PRIVATE_EXPOSURE|PRIVATE_SETTING/);
  } finally { h.cleanup(); }
});
test('prepared packets use the same hash and exact Medium model configurations as the app', () => {
  const h = harness();
  try {
    const packet = JSON.parse(execFileSync(process.execPath, ['scripts/prepare-key-sorting.mjs'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }));
    assert.deepEqual(packet.agentConfig, h.model.agentConfig);
    assert.deepEqual(Object.keys(packet.runEnvelopes), ['opus', 'sol']);
    assert.equal(packet.inputVersion, h.store.inputVersion);
    for (const a of h.model.agents) {
      assert.equal(packet.runEnvelopes[a].model, h.model.agentConfig[a].model);
      assert.equal(packet.runEnvelopes[a].settings.effort, 'medium');
    }
  } finally { h.cleanup(); }
});
test('studies from the earlier configuration are preserved, not relabeled or silently reused', async () => {
  const h = harness();
  try {
    const state = await h.store.readStudy();
    state.inputVersion = createHash('sha256').update(JSON.stringify({ instructions: h.model.instructions, pools: h.model.pools })).digest('hex');
    state.runs.astra = { model: 'gpt-6-astra' };
    const dir = path.join(h.temp, 'research/keys/entries'); fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'study-v2.json'), original = JSON.stringify(state);
    fs.writeFileSync(file, original);
    await assert.rejects(h.store.readStudy(), /different inputs or agent settings/);
    assert.equal(fs.readFileSync(file, 'utf8'), original);
  } finally { h.cleanup(); }
});
