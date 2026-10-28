import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export function harness(storage = 'file') {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hfe-keys-test-'));
  let coder = 'ben';
  const data = new Map(), history = [], modules = new Map();
  const transport = {
    storage,
    currentCoder: async () => coder,
    redis: async ([command, ...args]) => {
      if (command === 'GET') return data.get(args[0]) ?? null;
      if (command === 'HGETALL') return [];
      if (command === 'EVAL') {
        const [, keyCount, key, , expected, next] = args;
        if (keyCount !== '2') throw new Error('Unexpected CAS shape');
        if ((data.get(key) ?? '') !== expected) return 0;
        if (expected) history.push(expected);
        data.set(key, next);
        return 1;
      }
      throw new Error(`Unexpected command ${command}`);
    },
  };
  function load(file) {
    const filename = path.resolve(root, file);
    if (modules.has(filename)) return modules.get(filename).exports;
    const m = new Module(filename);
    modules.set(filename, m);
    m.filename = filename;
    m.paths = Module._nodeModulePaths(path.dirname(filename));
    const originalRequire = m.require.bind(m);
    m.require = (id) => {
      if (id === 'server-only') return {};
      if (id === '@/lib/coding') return transport;
      if (id.startsWith('@/')) return load(path.join('src', id.slice(2)) + '.ts');
      if (id.startsWith('.') && !path.extname(id)) return load(path.resolve(path.dirname(filename), id + '.ts'));
      return originalRequire(id);
    };
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    // Isolate file-backed tests from the developer's working entries and credentials.
    m._compile('const process = { cwd: () => ' + JSON.stringify(temp) + ', env: {} };\n' + code, filename);
    return m.exports;
  }
  const model = load('src/lib/key-model.ts'), store = load('src/lib/key-store.ts'), keys = load('src/lib/keys.ts');
  const sorting = (q, claim = 'Human claim', done = true) => ({ ...model.emptySorting(), categories: [{ id: 'k1', claim, reason: 'A reason supported by the supplied passages', direction: 'yes', passages: model.getPool(q).passages.map(p => p.id) }], done });
  const run = (agent) => ({ agent, model: model.agentConfig[agent].model, settings: { effort: model.agentConfig[agent].effort, testMarker: `PRIVATE_SETTING_${agent}` }, createdAt: '2026-10-17T12:00:00Z', inputVersion: store.inputVersion, instructionsVersion: model.instructions.version, independent: true, exposureNote: `PRIVATE_EXPOSURE_${agent}: none (simulated test)`, originalOutput: JSON.stringify(Object.fromEntries(model.pools.map(p => [p.question, sorting(p.question, `HIDDEN_${agent.toUpperCase()}_CLAIM`)]))) });
  const as = async (who, task) => { coder = who; return task(); };
  async function finishIndependent(withRule = true) {
    for (const human of ['ben', 'nathan']) await as(human, async () => {
      for (const p of model.pools) await keys.saveSorting(p.question, sorting(p.question), 0);
    });
    for (const a of model.agents) await keys.importAgentRun(run(a));
    if (withRule) await as('ben', () => keys.recordRule('An explicit test rule, recorded before any comparisons.', 0));
  }
  async function lockReference(q) {
    await as('ben', () => keys.startJoint(q, 'reference', 'ben'));
    await as('ben', () => keys.approveJoint(q, 'reference', 1, true));
    await as('nathan', () => keys.approveJoint(q, 'reference', 1, true));
  }
  function review() {
    return { ...model.emptyReview(), reference: { k1: { status: 'recovered', matches: ['k1'], note: 'Same conclusion and reason.' } }, categories: { k1: { status: 'supported', note: 'Passages support the stated argument.' } }, notes: 'Checked against the saved human reference.' };
  }
  return { temp, data, history, model, store, keys, sorting, run, as, finishIndependent, lockReference, review, cleanup: () => fs.rmSync(temp, { recursive: true, force: true }) };
}
