import { createClient } from '@libsql/client/web';

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const MIN_PHOTO_SLOTS = 20;
const DEFAULT_LOGO_PATH = 'assets/logo-oton.png';

const DEFAULT_BIOGRAPHY = {
  name: 'Óton Rodrigo',
  title: 'Corretor de Imóveis · CRECI MGF - 50403',
  text: 'Atendimento próximo e transparente em Tiros/MG e região.',
  photoDataUrl: null
};

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
  logoDataUrl: null,
  hideLogo: false,
  propertiesTitle: 'Imóveis',
  propertiesLinks: [
    { id: 'fp-1', label: 'À venda', href: 'imoveis.html?deal=venda' },
    { id: 'fp-2', label: 'Para alugar', href: 'imoveis.html?deal=aluguel' }
  ],
  regionTitle: 'Região',
  regionLinks: [
    { id: 'fr-1', label: 'Centro - Tiros', href: 'imoveis.html?onde=Centro' }
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

function mapFooter(data = {}) {
  const merged = { ...DEFAULT_FOOTER, ...data };
  const hideLogo = Boolean(merged.hideLogo);
  const logoDataUrl = hideLogo ? null : (merged.logoDataUrl || null);
  return {
    ...merged,
    hideLogo,
    logoDataUrl,
    logoUrl: hideLogo ? '' : (logoDataUrl || DEFAULT_LOGO_PATH)
  };
}

const DEFAULT_OFFICE = {
  title: 'Conheça nosso escritório',
  text: 'Um espaço acolhedor em Tiros/MG para atendimento presencial.',
  coverId: null,
  intervalSeconds: 5,
  photos: []
};

const DEFAULT_SITE_VISUAL = {
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
};

function db(env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  });
}

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = !origin || allowed.includes(origin) || allowed.includes('*') || allowed.includes('null');
  return {
    'Access-Control-Allow-Origin': ok ? (origin || '*') : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extra
    }
  });
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(`oton-v1:${String(password)}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleLabel: row.role === 'admin' ? 'Administrador' : row.role
  };
}

async function getMeta(client, key, fallback) {
  const result = await client.execute({ sql: 'SELECT value FROM meta WHERE key = ?', args: [key] });
  if (!result.rows.length) return structuredClone(fallback);
  try {
    return JSON.parse(result.rows[0].value);
  } catch {
    return structuredClone(fallback);
  }
}

async function setMeta(client, key, value) {
  await client.execute({
    sql: `INSERT INTO meta (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, JSON.stringify(value)]
  });
}

async function requireAdmin(request, client) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const now = Date.now();
  const result = await client.execute({
    sql: `SELECT u.* FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > ?`,
    args: [token, now]
  });
  if (!result.rows.length) return null;
  const user = result.rows[0];
  if (user.role !== 'admin') return null;
  return { user, token };
}

function mapProperty(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    deal: row.deal,
    neighborhood: row.neighborhood,
    city: row.city,
    price: Number(row.price) || 0,
    area: Number(row.area) || 0,
    bedrooms: Number(row.bedrooms) || 0,
    bathrooms: Number(row.bathrooms) || 0,
    suites: Number(row.suites) || 0,
    parking: Number(row.parking) || 0,
    condoName: row.condo_name || '',
    condoFee: Number(row.condo_fee) || 0,
    description: row.description || '',
    featured: Boolean(row.featured),
    status: row.status || 'disponivel',
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0
  };
}

function mapPhoto(row) {
  return {
    id: row.id,
    propertyId: row.property_id,
    order: Number(row.sort_order) || 0,
    source: row.source,
    url: row.url || '',
    name: row.name || ''
  };
}

async function getPropertyFull(client, id) {
  const prop = await client.execute({ sql: 'SELECT * FROM properties WHERE id = ?', args: [id] });
  if (!prop.rows.length) return null;
  const photos = await client.execute({
    sql: 'SELECT * FROM photos WHERE property_id = ? ORDER BY sort_order ASC',
    args: [id]
  });
  return {
    ...mapProperty(prop.rows[0]),
    photos: photos.rows.map(mapPhoto),
    photoIds: photos.rows.map((p) => p.id)
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const client = db(env);

    try {
      if (path === '/health' && request.method === 'GET') {
        return json({ ok: true }, 200, cors);
      }

      if (path === '/auth/login' && request.method === 'POST') {
        const body = await readJson(request);
        const email = String(body?.email || '').trim().toLowerCase();
        const password = String(body?.password || '');
        const users = await client.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
        if (!users.rows.length) {
          return json({ ok: false, error: 'E-mail ou senha inválidos.' }, 401, cors);
        }
        const user = users.rows[0];
        if (user.role !== 'admin') {
          return json({ ok: false, error: 'Acesso disponível apenas para administradores.' }, 403, cors);
        }
        const passwordHash = await hashPassword(password);
        if (passwordHash !== user.password_hash) {
          return json({ ok: false, error: 'E-mail ou senha inválidos.' }, 401, cors);
        }
        const token = uid('sess');
        const expiresAt = Date.now() + SESSION_TTL_MS;
        await client.execute({
          sql: 'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
          args: [token, user.id, expiresAt]
        });
        return json({
          ok: true,
          token,
          expiresAt,
          user: publicUser(user),
          home: 'admin.html'
        }, 200, cors);
      }

      if (path === '/auth/logout' && request.method === 'POST') {
        const auth = await requireAdmin(request, client);
        if (auth?.token) {
          await client.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [auth.token] });
        }
        return json({ ok: true }, 200, cors);
      }

      if (path === '/auth/me' && request.method === 'GET') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ ok: false }, 401, cors);
        return json({ ok: true, user: publicUser(auth.user) }, 200, cors);
      }

      if (path === '/auth/change-password' && request.method === 'POST') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request);
        const currentPassword = String(body?.currentPassword || '');
        const nextPassword = String(body?.nextPassword || '');
        if (nextPassword.length < 6) {
          return json({ error: 'A nova senha deve ter ao menos 6 caracteres.' }, 400, cors);
        }
        const currentHash = await hashPassword(currentPassword);
        if (currentHash !== auth.user.password_hash) {
          return json({ error: 'Senha atual incorreta.' }, 400, cors);
        }
        const passwordHash = await hashPassword(nextPassword);
        const now = Date.now();
        await client.execute({
          sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
          args: [passwordHash, now, auth.user.id]
        });
        return json({ ok: true }, 200, cors);
      }

      if (path === '/properties/public' && request.method === 'GET') {
        const rows = await client.execute({
          sql: `SELECT * FROM properties WHERE status = 'disponivel' ORDER BY updated_at DESC`
        });
        const list = [];
        for (const row of rows.rows) {
          const full = await getPropertyFull(client, row.id);
          const photos = (full.photos || []).map((photo) => ({
            id: photo.id,
            url: photo.url,
            name: photo.name
          }));
          list.push({
            ...full,
            status: 'disponivel',
            image: photos[0]?.url || '',
            photos
          });
        }
        return json(list, 200, cors);
      }

      if (path === '/properties' && request.method === 'GET') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const rows = await client.execute('SELECT * FROM properties ORDER BY updated_at DESC');
        return json(rows.rows.map(mapProperty), 200, cors);
      }

      if (path === '/properties/next-code' && request.method === 'GET') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const rows = await client.execute('SELECT id FROM properties');
        let max = 0;
        for (const row of rows.rows) {
          const match = String(row.id).match(/(\d+)$/);
          if (match) max = Math.max(max, Number(match[1]));
        }
        return json({ code: `OR-${String(max + 1).padStart(3, '0')}` }, 200, cors);
      }

      const propertyMatch = path.match(/^\/properties\/([^/]+)$/);
      if (propertyMatch && request.method === 'GET') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const full = await getPropertyFull(client, decodeURIComponent(propertyMatch[1]));
        if (!full) return json({ error: 'Imóvel não encontrado.' }, 404, cors);
        return json(full, 200, cors);
      }

      if (path === '/properties' && request.method === 'POST') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request);
        if (!body) return json({ error: 'JSON inválido.' }, 400, cors);
        const now = Date.now();
        let id = String(body.id || '').trim();
        if (!id) {
          const rows = await client.execute('SELECT id FROM properties');
          let max = 0;
          for (const row of rows.rows) {
            const match = String(row.id).match(/(\d+)$/);
            if (match) max = Math.max(max, Number(match[1]));
          }
          id = `OR-${String(max + 1).padStart(3, '0')}`;
        }
        const existing = await getPropertyFull(client, id);
        const status = ['disponivel', 'alugado', 'vendido'].includes(body.status) ? body.status : 'disponivel';
        await client.execute({
          sql: `INSERT INTO properties (
            id, title, type, deal, neighborhood, city, price, area, bedrooms, bathrooms, suites, parking,
            condo_name, condo_fee, description, featured, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title=excluded.title, type=excluded.type, deal=excluded.deal, neighborhood=excluded.neighborhood,
            city=excluded.city, price=excluded.price, area=excluded.area, bedrooms=excluded.bedrooms,
            bathrooms=excluded.bathrooms, suites=excluded.suites, parking=excluded.parking,
            condo_name=excluded.condo_name, condo_fee=excluded.condo_fee, description=excluded.description,
            featured=excluded.featured, status=excluded.status, updated_at=excluded.updated_at`,
          args: [
            id,
            String(body.title || '').trim(),
            body.type,
            body.deal,
            String(body.neighborhood || '').trim(),
            String(body.city || 'Tiros').trim(),
            Number(body.price) || 0,
            Number(body.area) || 0,
            Number(body.bedrooms) || 0,
            Number(body.bathrooms) || 0,
            Number(body.suites) || 0,
            Number(body.parking) || 0,
            String(body.condoName || '').trim(),
            Number(body.condoFee) || 0,
            String(body.description || '').trim(),
            body.featured ? 1 : 0,
            status,
            existing?.createdAt || now,
            now
          ]
        });

        const photosDraft = Array.isArray(body.photos) ? body.photos : [];
        await client.execute({ sql: 'DELETE FROM photos WHERE property_id = ?', args: [id] });
        for (let index = 0; index < photosDraft.length; index += 1) {
          const item = photosDraft[index];
          const photoUrl = item.url || item.dataUrl || '';
          if (!photoUrl) continue;
          const source = photoUrl.startsWith('data:') ? 'data' : 'url';
          await client.execute({
            sql: 'INSERT INTO photos (id, property_id, sort_order, source, url, name) VALUES (?, ?, ?, ?, ?, ?)',
            args: [
              item.id || uid('ph'),
              id,
              index,
              source,
              photoUrl,
              item.name || `foto-${index + 1}.jpg`
            ]
          });
        }

        return json(await getPropertyFull(client, id), 200, cors);
      }

      if (propertyMatch && request.method === 'DELETE') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const id = decodeURIComponent(propertyMatch[1]);
        await client.execute({ sql: 'DELETE FROM photos WHERE property_id = ?', args: [id] });
        await client.execute({ sql: 'DELETE FROM properties WHERE id = ?', args: [id] });
        return json({ ok: true }, 200, cors);
      }

      if (path === '/biography' && request.method === 'GET') {
        const data = await getMeta(client, 'biography', DEFAULT_BIOGRAPHY);
        return json({
          name: data.name || DEFAULT_BIOGRAPHY.name,
          title: data.title || DEFAULT_BIOGRAPHY.title,
          text: data.text || DEFAULT_BIOGRAPHY.text,
          photoUrl: data.photoDataUrl || '',
          photoDataUrl: data.photoDataUrl || null
        }, 200, cors);
      }

      if (path === '/biography' && request.method === 'PUT') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request);
        const current = await getMeta(client, 'biography', DEFAULT_BIOGRAPHY);
        let photoDataUrl = current.photoDataUrl || null;
        if (body?.clearPhoto) photoDataUrl = null;
        else if (body?.photoDataUrl) photoDataUrl = body.photoDataUrl;
        const record = {
          name: String(body?.name || '').trim() || DEFAULT_BIOGRAPHY.name,
          title: String(body?.title || '').trim() || DEFAULT_BIOGRAPHY.title,
          text: String(body?.text || '').trim(),
          photoDataUrl
        };
        await setMeta(client, 'biography', record);
        return json({
          ...record,
          photoUrl: record.photoDataUrl || ''
        }, 200, cors);
      }

      if (path === '/navigation' && request.method === 'GET') {
        const items = await getMeta(client, 'navigation', DEFAULT_NAVIGATION);
        return json(Array.isArray(items) && items.length ? items : DEFAULT_NAVIGATION, 200, cors);
      }

      if (path === '/navigation' && request.method === 'PUT') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request);
        const items = (Array.isArray(body) ? body : body?.items || [])
          .map((item, index) => ({
            id: String(item?.id || `nav-${index + 1}`),
            label: String(item?.label || '').trim(),
            href: String(item?.href || '').trim()
          }))
          .filter((item) => item.label && item.href);
        await setMeta(client, 'navigation', items.length ? items : DEFAULT_NAVIGATION);
        return json(items.length ? items : DEFAULT_NAVIGATION, 200, cors);
      }

      if (path === '/footer' && request.method === 'GET') {
        const data = await getMeta(client, 'footer', DEFAULT_FOOTER);
        return json(mapFooter(data), 200, cors);
      }

      if (path === '/footer' && request.method === 'PUT') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request) || {};
        const current = await getMeta(client, 'footer', DEFAULT_FOOTER);

        let hideLogo = Boolean(current.hideLogo);
        let logoDataUrl = current.logoDataUrl || null;

        if (body.removeLogo || body.hideLogo === true || body.clearLogo) {
          hideLogo = true;
          logoDataUrl = null;
        } else if (body.logoDataUrl) {
          hideLogo = false;
          logoDataUrl = body.logoDataUrl;
        } else if (body.hideLogo === false) {
          hideLogo = false;
        }

        const {
          clearLogo,
          removeLogo,
          logoUrl,
          keepLogo,
          logoBlob,
          ...rest
        } = body;

        const record = mapFooter({
          ...current,
          ...rest,
          hideLogo,
          logoDataUrl
        });
        const toStore = { ...record };
        delete toStore.logoUrl;
        await setMeta(client, 'footer', toStore);
        return json(record, 200, cors);
      }

      if (path === '/office' && request.method === 'GET') {
        const data = await getMeta(client, 'officeShowcase', DEFAULT_OFFICE);
        return json({
          title: data.title || DEFAULT_OFFICE.title,
          text: data.text || DEFAULT_OFFICE.text,
          coverId: data.coverId || null,
          intervalSeconds: Math.min(60, Math.max(2, Number(data.intervalSeconds) || 5)),
          photos: Array.isArray(data.photos) ? data.photos : []
        }, 200, cors);
      }

      if (path === '/office' && request.method === 'PUT') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request) || {};
        const record = {
          title: String(body.title || '').trim() || DEFAULT_OFFICE.title,
          text: String(body.text || '').trim() || DEFAULT_OFFICE.text,
          coverId: body.coverId || null,
          intervalSeconds: Math.min(60, Math.max(2, Number(body.intervalSeconds) || 5)),
          photos: Array.isArray(body.photos) ? body.photos : []
        };
        await setMeta(client, 'officeShowcase', record);
        return json(record, 200, cors);
      }

      if (path === '/site-visual' && request.method === 'GET') {
        const data = await getMeta(client, 'siteVisual', DEFAULT_SITE_VISUAL);
        return json({
          intervalSeconds: Math.min(60, Math.max(2, Number(data.intervalSeconds) || 6)),
          logoUrl: data.logoDataUrl || DEFAULT_LOGO_PATH,
          logoDataUrl: data.logoDataUrl || null,
          banners: Array.isArray(data.banners) && data.banners.length ? data.banners : DEFAULT_SITE_VISUAL.banners
        }, 200, cors);
      }

      if (path === '/site-visual' && request.method === 'PUT') {
        const auth = await requireAdmin(request, client);
        if (!auth) return json({ error: 'Não autorizado.' }, 401, cors);
        const body = await readJson(request) || {};
        const current = await getMeta(client, 'siteVisual', DEFAULT_SITE_VISUAL);
        let logoDataUrl = current.logoDataUrl || null;
        if (body.clearLogo) logoDataUrl = null;
        else if (body.logoDataUrl) logoDataUrl = body.logoDataUrl;
        const banners = Array.isArray(body.banners) ? body.banners : current.banners;
        const record = {
          intervalSeconds: Math.min(60, Math.max(2, Number(body.intervalSeconds) || 6)),
          logoDataUrl,
          banners: banners.length ? banners : DEFAULT_SITE_VISUAL.banners
        };
        await setMeta(client, 'siteVisual', record);
        return json({
          ...record,
          logoUrl: record.logoDataUrl || DEFAULT_LOGO_PATH
        }, 200, cors);
      }

      return json({ error: 'Rota não encontrada.', path }, 404, cors);
    } catch (error) {
      console.error(error);
      return json({ error: error?.message || 'Erro interno.' }, 500, cors);
    }
  }
};
