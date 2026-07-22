import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';
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

function hashPassword(password) {
  return createHash('sha256').update(`oton-v1:${String(password)}`).digest('hex');
}

const SEED_PROPERTIES = [
  {
    id: 'OR-001',
    title: 'Casa residencial no Centro',
    type: 'Casa',
    deal: 'venda',
    neighborhood: 'Centro',
    city: 'Tiros',
    price: 380000,
    area: 180,
    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    parking: 2,
    description: 'Casa ampla no Centro de Tiros, com ótima localização.',
    featured: 1,
    status: 'disponivel',
    photos: [
      'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85'
    ]
  },
  {
    id: 'OR-002',
    title: 'Apartamento moderno',
    type: 'Apartamento',
    deal: 'aluguel',
    neighborhood: 'Centro',
    city: 'Tiros',
    price: 1200,
    area: 75,
    bedrooms: 2,
    bathrooms: 1,
    suites: 0,
    parking: 1,
    description: 'Apartamento compacto e funcional para locação.',
    featured: 1,
    status: 'disponivel',
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=85'
    ]
  },
  {
    id: 'OR-003',
    title: 'Chácara para lazer',
    type: 'Chácara',
    deal: 'venda',
    neighborhood: 'Zona Rural',
    city: 'Tiros',
    price: 520000,
    area: 12000,
    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    parking: 4,
    description: 'Chácara com área verde e espaço amplo para lazer.',
    featured: 1,
    status: 'disponivel',
    photos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85'
    ]
  }
];

const DEFAULT_NAVIGATION = [
  { id: 'nav-imoveis', label: 'Imóveis', href: 'imoveis.html' },
  { id: 'nav-anunciar', label: 'Anuncie seu imóvel', href: 'index.html#anunciar' },
  { id: 'nav-servicos', label: 'Serviços', href: 'index.html#servicos' },
  { id: 'nav-sobre', label: 'Sobre', href: 'index.html#sobre' },
  { id: 'nav-contato', label: 'Contato', href: 'index.html#contato' }
];

const DEFAULT_FOOTER = {
  brandName: 'Óton Rodrigo Imóveis',
  creci: 'CRECI MGF - 50403',
  brandText: 'Compra, venda e locação em Tiros/MG e região, com atendimento próximo e transparente.',
  propertiesTitle: 'Imóveis',
  propertiesLinks: [
    { id: 'fp-1', label: 'À venda', href: 'imoveis.html?deal=venda' },
    { id: 'fp-2', label: 'Para alugar', href: 'imoveis.html?deal=aluguel' },
    { id: 'fp-3', label: 'Casas à venda', href: 'imoveis.html?deal=venda&tipo=Casa' },
    { id: 'fp-4', label: 'Chácaras à venda', href: 'imoveis.html?deal=venda&tipo=Chácara' }
  ],
  regionTitle: 'Região',
  regionLinks: [
    { id: 'fr-1', label: 'Centro - Tiros', href: 'imoveis.html?onde=Centro' },
    { id: 'fr-2', label: 'São Sebastião - Tiros', href: 'imoveis.html?onde=S%C3%A3o%20Sebasti%C3%A3o' },
    { id: 'fr-3', label: 'Jardim Esperança - Tiros', href: 'imoveis.html?onde=Jardim%20Esperan%C3%A7a' },
    { id: 'fr-4', label: 'Zona Rural - Tiros', href: 'imoveis.html?onde=Zona%20Rural' }
  ],
  contactTitle: 'Contato',
  phoneLabel: '(34) 99833-6147',
  phoneHref: 'tel:+5534998336147',
  whatsappLabel: '(34) 99833-6147',
  whatsappHref: 'https://wa.me/5534998336147',
  loginLabel: 'Área do cliente',
  loginHref: 'login.html',
  instagramLabel: '@oton.imóveis',
  instagramHref: 'https://instagram.com/oton.imoveis',
  copyright: '© 2026 Óton Rodrigo Imóveis. Todos os direitos reservados.',
  backToTopLabel: 'Voltar ao topo ↑'
};

const client = createClient({ url, authToken });

const schema = readFileSync(join(root, 'schema.sql'), 'utf8');
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

console.log('Aplicando schema...');
for (const sql of statements) {
  await client.execute(sql);
}

try {
  await client.execute(`ALTER TABLE properties ADD COLUMN keywords TEXT NOT NULL DEFAULT ''`);
  console.log('Coluna keywords adicionada.');
} catch {
  /* coluna já existe */
}

const now = Date.now();
const adminHash = hashPassword('Oton2026**');

await client.execute({
  sql: `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'admin', ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          password_hash = excluded.password_hash,
          role = 'admin',
          updated_at = excluded.updated_at`,
  args: ['user-admin', 'Óton Rodrigo', 'oton.corretor50403@gmail.com', adminHash, now, now]
});

const metaDefaults = {
  biography: {
    name: 'Óton Rodrigo',
    title: 'Corretor de Imóveis · CRECI MGF - 50403',
    text: 'Atendimento próximo e transparente em Tiros/MG e região. Compra, venda, locação e avaliação de imóveis urbanos e rurais, com cuidado em cada etapa da negociação.',
    photoDataUrl: null
  },
  navigation: DEFAULT_NAVIGATION,
  footer: DEFAULT_FOOTER,
  officeShowcase: {
    title: 'Conheça nosso escritório',
    text: 'Um espaço acolhedor em Tiros/MG para atendimento presencial na compra, venda e locação.',
    coverId: null,
    intervalSeconds: 5,
    photos: []
  },
  siteVisual: {
    intervalSeconds: 6,
    logoDataUrl: null,
    banners: [
      {
        id: 'banner-default',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85',
        name: 'Banner padrão'
      }
    ]
  }
};

for (const [key, value] of Object.entries(metaDefaults)) {
  const existing = await client.execute({ sql: 'SELECT key FROM meta WHERE key = ?', args: [key] });
  if (!existing.rows.length) {
    await client.execute({
      sql: 'INSERT INTO meta (key, value) VALUES (?, ?)',
      args: [key, JSON.stringify(value)]
    });
  }
}

const count = await client.execute('SELECT COUNT(*) AS c FROM properties');
const propertyCount = Number(count.rows[0].c || 0);

if (propertyCount === 0) {
  console.log('Inserindo imóveis de exemplo...');
  for (const item of SEED_PROPERTIES) {
    await client.execute({
      sql: `INSERT INTO properties (
        id, title, type, deal, neighborhood, city, price, area, bedrooms, bathrooms, suites, parking,
        condo_name, condo_fee, description, featured, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, ?, ?, ?, ?, ?)`,
      args: [
        item.id, item.title, item.type, item.deal, item.neighborhood, item.city, item.price, item.area,
        item.bedrooms, item.bathrooms, item.suites, item.parking, item.description, item.featured,
        item.status, now, now
      ]
    });
    for (let i = 0; i < item.photos.length; i += 1) {
      await client.execute({
        sql: 'INSERT INTO photos (id, property_id, sort_order, source, url, name) VALUES (?, ?, ?, ?, ?, ?)',
        args: [`ph-${item.id}-${i}`, item.id, i, 'url', item.photos[i], `foto-${i + 1}.jpg`]
      });
    }
  }
}

console.log('Migração concluída com sucesso.');
console.log('Admin: oton.corretor50403@gmail.com / Oton2026**');
