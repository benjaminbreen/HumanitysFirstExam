// Emit the shared task and exact agent configurations. No model API calls.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const instructions = JSON.parse(await readFile(new URL('../research/keys/instructions.json', import.meta.url), 'utf8'));
const pools = JSON.parse(await readFile(new URL('../research/keys/pools.json', import.meta.url), 'utf8'));
const agentConfig = JSON.parse(await readFile(new URL('../research/keys/agents.json', import.meta.url), 'utf8'));
const inputVersion = createHash('sha256').update(JSON.stringify({ instructions, pools, agentConfig })).digest('hex');
const packet = {
  instructions, inputVersion, pools, agentConfig,
  outputFormat: 'Return one JSON object with exactly Q01, Q08, Q18, Q23, Q30 and Q39. Each value has categories (id, claim, reason, direction, passages), off, and unclear. Use short category IDs such as c1 and c2 (letters, digits, hyphens or underscores, at most 20 characters). Claims may have at most 600 characters and reasons at most 1200. Use direction values yes/no/other, including for Q18 Develops/Diminishes/Other, and the supplied passage IDs. No markdown fences.',
  runEnvelopes: Object.fromEntries(Object.entries(agentConfig).map(([agent, config]) => [agent, {
    agent, model: config.model, settings: { effort: config.effort }, createdAt: 'ISO date of run', inputVersion,
    instructionsVersion: instructions.version, independent: true,
    exposureNote: 'Record any exposure, or explicitly state none', originalOutput: 'The exact original JSON response as a string',
  }])),
};
const serialized = JSON.stringify(packet, null, 2) + '\n';
if (process.argv.slice(2).some((arg) => arg !== '--write')) throw new Error('Usage: node scripts/prepare-key-sorting.mjs [--write]');
if (!process.argv.includes('--write')) process.stdout.write(serialized);
else {
  const dir = fileURLToPath(new URL('../research/keys/entries/', import.meta.url));
  await mkdir(dir, { recursive: true });
  const inputFile = path.join(dir, 'independent-run-input.json');
  let previous;
  try { previous = await readFile(inputFile, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (previous && previous !== serialized) {
    const hash = createHash('sha256').update(previous).digest('hex');
    await writeFile(path.join(dir, `previous-input-${hash}.json`), previous, { flag: 'wx' }).catch((e) => { if (e.code !== 'EEXIST') throw e; });
  }
  await writeFile(inputFile, serialized);
  const sortingInputFile = path.join(dir, 'sorting-input.json');
  await writeFile(sortingInputFile, JSON.stringify(pools, null, 2) + '\n');
  for (const agent of Object.keys(agentConfig)) {
    const outputDir = path.join(dir, 'runs', agent);
    const promptFile = path.join(dir, `run-${agent}-prompt.txt`);
    await writeFile(promptFile, instructions.text + '\n');
    const setup = `Read the task prompt at ${promptFile} and all questions and passages at ${sortingInputFile}. Use only these task materials; do not read project methodology, history or existing results.\n\n` +
      `${packet.outputFormat}\n\n` +
      `Save the unedited response to ${path.join(outputDir, 'original.json')}, creating the directory if necessary. Do not overwrite an existing result. Keep categories and assignments out of chat and printed tool output; return only the saved path or a technical error.\n`;
    await writeFile(path.join(dir, `run-${agent}-setup.txt`), setup);
  }
  process.stdout.write(`Prepared ${pools.length} questions for Opus 5.5 Medium and GPT-6.1 Sol Medium.\nInputs and prompts: ${dir}\nNo model runs were started.\n`);
}
