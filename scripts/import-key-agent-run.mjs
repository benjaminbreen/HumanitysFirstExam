// Import a saved original run without displaying its categories to historians.
import { readFile } from 'node:fs/promises';
const file = process.argv[2];
const base = process.env.KEYS_APP_URL ?? 'http://localhost:3000';
const token = process.env.KEYS_IMPORT_TOKEN;
if (!file || !token) throw new Error('Usage: KEYS_APP_URL=... KEYS_IMPORT_TOKEN=... node scripts/import-key-agent-run.mjs <run-envelope.json>');
const body = await readFile(file, 'utf8');
const response = await fetch(new URL('/api/keys/agents', base), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body });
const result = await response.json();
if (!response.ok) throw new Error(result.error ?? `Import failed (${response.status})`);
process.stdout.write('Independent run recorded. Its contents remain hidden until all human references lock.\n');
