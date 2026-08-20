/**
 * Adiciona campos Casa (área construída) e Fazenda no Turso.
 * Uso: node scripts/migrate-property-fields.mjs
 */
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadDevVars() {
  try {
    const raw = readFileSync(join(root, '.dev.vars'), 'utf8');
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const i = trimmed.indexOf('=');
      if (i === -1) continue;
      out[trimmed.slice(0, i)] = trimmed.slice(i + 1);
    }
    return out;
  } catch {
    return {};
  }
}

const vars = { ...loadDevVars(), ...process.env };
const url = vars.TURSO_DATABASE_URL;
const authToken = vars.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN em api/.dev.vars');
  process.exit(1);
}

const ALTERS = [
  'ALTER TABLE properties ADD COLUMN built_area REAL NOT NULL DEFAULT 0',
  'ALTER TABLE properties ADD COLUMN hectares REAL NOT NULL DEFAULT 0',
  'ALTER TABLE properties ADD COLUMN price_per_hectare REAL NOT NULL DEFAULT 0',
  "ALTER TABLE properties ADD COLUMN farm_notes TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE properties ADD COLUMN available_from TEXT NOT NULL DEFAULT ''"
];

const client = createClient({ url, authToken });

for (const sql of ALTERS) {
  try {
    await client.execute(sql);
    console.log('OK:', sql);
  } catch (error) {
    const message = String(error?.message || error);
    if (/duplicate column/i.test(message)) {
      console.log('Já existe:', sql);
    } else {
      console.error('Falha:', sql, message);
      process.exit(1);
    }
  }
}

console.log('Migração de campos concluída.');
