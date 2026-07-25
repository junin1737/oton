/**
 * Migra fotos data: (base64) do Turso para o Cloudflare R2 via API.
 * Uso:
 *   node scripts/migrate-photos-to-r2.mjs
 *   (com API_URL e token de admin, ou login automático)
 */
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
const API_URL = (vars.API_URL || 'https://oton-api.sebastiaojr1737.workers.dev').replace(/\/+$/, '');
const email = vars.ADMIN_EMAIL || 'oton.corretor50403@gmail.com';
const password = vars.ADMIN_PASSWORD || 'Oton2026**';

async function main() {
  console.log(`API: ${API_URL}`);
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const login = await loginRes.json();
  if (!loginRes.ok || !login.token) {
    throw new Error(login.error || 'Falha no login admin');
  }

  console.log('Migrando fotos para R2...');
  const migrateRes = await fetch(`${API_URL}/admin/migrate-photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.token}` }
  });
  const result = await migrateRes.json();
  if (!migrateRes.ok) {
    throw new Error(result.error || `Erro ${migrateRes.status}`);
  }

  console.log(JSON.stringify(result, null, 2));
  console.log('Concluído.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
