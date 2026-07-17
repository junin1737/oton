/**
 * Camada de dados local (IndexedDB) para o site Óton Rodrigo.
 * Armazena imóveis e fotos (Blob) no navegador.
 */
const OtonStore = (() => {
  const DB_NAME = 'oton-imoveis';
  const DB_VERSION = 3;
  const SESSION_KEY = 'oton-session';
  const MIN_PHOTO_SLOTS = 20;

  const ROLES = {
    admin: { id: 'admin', label: 'Administrador', home: 'admin.html' }
  };

  const DEFAULT_USERS = [
    {
      id: 'user-admin',
      name: 'Óton Rodrigo',
      email: 'admin@oton.com.br',
      password: 'oton2026',
      role: 'admin'
    }
  ];

  const DEFAULT_BIOGRAPHY = {
    name: 'Óton Rodrigo',
    title: 'Corretor de Imóveis · CRECI MGF - 50403',
    text: 'Atendimento próximo e transparente em Tiros/MG e região. Compra, venda, locação e avaliação de imóveis urbanos e rurais, com cuidado em cada etapa da negociação.',
    photoBlob: null
  };

  const DEFAULT_NAVIGATION = [
    { id: 'nav-imoveis', label: 'Imóveis', href: 'imoveis.html' },
    { id: 'nav-anunciar', label: 'Anuncie seu imóvel', href: 'index.html#anunciar' },
    { id: 'nav-servicos', label: 'Serviços', href: 'index.html#servicos' },
    { id: 'nav-sobre', label: 'Sobre', href: 'index.html#sobre' },
    { id: 'nav-contato', label: 'Contato', href: 'index.html#contato' }
  ];

  const DEFAULT_OFFICE_SHOWCASE = {
    title: 'Conheça nosso escritório',
    text: 'Um espaço acolhedor em Tiros/MG para atendimento presencial na compra, venda e locação.',
    coverId: null,
    photos: []
  };


  const SEED = [
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
      featured: true,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=85' },
        { source: 'url', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85' },
        { source: 'url', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85' }
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
      featured: true,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85' },
        { source: 'url', url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=85' }
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
      featured: true,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85' },
        { source: 'url', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85' }
      ]
    },
    {
      id: 'OR-004',
      title: 'Casa ampla com quintal',
      type: 'Casa',
      deal: 'venda',
      neighborhood: 'São Sebastião',
      city: 'Tiros',
      price: 295000,
      area: 140,
      bedrooms: 3,
      bathrooms: 2,
      suites: 0,
      parking: 2,
      description: '',
      featured: false,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85' }
      ]
    },
    {
      id: 'OR-005',
      title: 'Terreno residencial',
      type: 'Terreno',
      deal: 'venda',
      neighborhood: 'Jardim Esperança',
      city: 'Tiros',
      price: 95000,
      area: 360,
      bedrooms: 0,
      bathrooms: 0,
      suites: 0,
      parking: 0,
      description: '',
      featured: false,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' }
      ]
    },
    {
      id: 'OR-006',
      title: 'Sala comercial no Centro',
      type: 'Comercial',
      deal: 'aluguel',
      neighborhood: 'Centro',
      city: 'Tiros',
      price: 1800,
      area: 48,
      bedrooms: 0,
      bathrooms: 1,
      suites: 0,
      parking: 1,
      description: '',
      featured: false,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85' }
      ]
    },
    {
      id: 'OR-007',
      title: 'Casa térrea reformada',
      type: 'Casa',
      deal: 'venda',
      neighborhood: 'Centro',
      city: 'Tiros',
      price: 450000,
      area: 210,
      bedrooms: 4,
      bathrooms: 3,
      suites: 1,
      parking: 3,
      description: '',
      featured: false,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85' }
      ]
    },
    {
      id: 'OR-008',
      title: 'Imóvel rural produtivo',
      type: 'Rural',
      deal: 'venda',
      neighborhood: 'Zona Rural',
      city: 'Tiros',
      price: 890000,
      area: 45000,
      bedrooms: 4,
      bathrooms: 2,
      suites: 1,
      parking: 5,
      description: '',
      featured: false,
      photos: [
        { source: 'url', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85' }
      ]
    }
  ];

  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('properties')) {
          const store = db.createObjectStore('properties', { keyPath: 'id' });
          store.createIndex('deal', 'deal', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('photos')) {
          const photos = db.createObjectStore('photos', { keyPath: 'id' });
          photos.createIndex('propertyId', 'propertyId', { unique: false });
        }
        if (!db.objectStoreNames.contains('users')) {
          const users = db.createObjectStore('users', { keyPath: 'id' });
          users.createIndex('email', 'email', { unique: true });
          users.createIndex('role', 'role', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Falha ao abrir banco local'));
      request.onblocked = () => {
        console.warn('IndexedDB bloqueado. Feche outras abas do site e tente de novo.');
      };
    });
    return dbPromise;
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transação abortada'));
    });
  }

  function req(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /** Hash estável sem depender de crypto.subtle (funciona em qualquer contexto). */
  async function hashPassword(password) {
    const input = `oton-v1:${String(password)}`;
    if (globalThis.crypto?.subtle) {
      try {
        const data = new TextEncoder().encode(input);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('crypto.subtle indisponível, usando fallback.', error);
      }
    }
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `fb_${(hash >>> 0).toString(16)}`;
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: ROLES[user.role]?.label || user.role
    };
  }

  function createSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleLabel: ROLES[user.role]?.label || user.role,
      loggedAt: Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem('oton-admin-session');
    return session;
  }

  function findDemoUser(email, password) {
    const normalized = String(email || '').trim().toLowerCase();
    return DEFAULT_USERS.find((user) => user.email === normalized && user.password === String(password || '')) || null;
  }

  async function ensureUsersSeeded() {
    const db = await openDb();
    if (!db.objectStoreNames.contains('users')) {
      dbPromise = null;
      throw new Error('Base de usuários indisponível. Atualize a página.');
    }

    const metaTx = db.transaction('meta', 'readonly');
    const seedVersion = await req(metaTx.objectStore('meta').get('usersSeedVersion'));
    await txDone(metaTx);

    const countTx = db.transaction('users', 'readonly');
    const existingUsers = await req(countTx.objectStore('users').getAll());
    await txDone(countTx);

    const needsReseed = !seedVersion || seedVersion.value < 4 || existingUsers.length < DEFAULT_USERS.length;
    if (!needsReseed) return;

    const prepared = [];
    for (const item of DEFAULT_USERS) {
      prepared.push({
        id: item.id,
        name: item.name,
        email: item.email.toLowerCase(),
        passwordHash: await hashPassword(item.password),
        role: item.role,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    const write = db.transaction(['meta', 'users'], 'readwrite');
    const users = write.objectStore('users');
    // Remove usuários demo antigos (proprietário/inquilino e e-mails antigos)
    existingUsers.forEach((user) => {
      if (
        user.role !== 'admin' ||
        String(user.email || '').endsWith('@oton.imoveis') ||
        String(user.email || '').includes('proprietario@') ||
        String(user.email || '').includes('inquilino@')
      ) {
        users.delete(user.id);
      }
    });
    prepared.forEach((user) => users.put(user));
    write.objectStore('meta').put({ key: 'usersSeeded', value: true });
    write.objectStore('meta').put({ key: 'usersSeedVersion', value: 4 });
    await txDone(write);
  }

  async function findUserByEmail(email) {
    await ensureUsersSeeded();
    const db = await openDb();
    const tx = db.transaction('users', 'readonly');
    const user = await req(tx.objectStore('users').index('email').get(String(email || '').trim().toLowerCase()));
    await txDone(tx);
    return user || null;
  }

  async function login(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const plainPassword = String(password || '');

    try {
      const user = await findUserByEmail(normalizedEmail);
      if (user) {
        if (user.role !== 'admin') {
          return { ok: false, error: 'Acesso disponível apenas para administradores no momento.' };
        }
        const passwordHash = await hashPassword(plainPassword);
        if (passwordHash === user.passwordHash) {
          const session = createSession(user);
          return { ok: true, user: session, home: ROLES.admin.home };
        }
      }
    } catch (error) {
      console.warn('Login via IndexedDB falhou, tentando conta demo.', error);
    }

    const demo = findDemoUser(normalizedEmail, plainPassword);
    if (demo && demo.role === 'admin') {
      const session = createSession(demo);
      return { ok: true, user: session, home: ROLES.admin.home };
    }

    return { ok: false, error: 'E-mail ou senha inválidos.' };
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isAuthenticated(roles = null) {
    const session = getSession();
    if (!session) return false;
    if (!roles) return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(session.role);
  }

  function requireAuth(roles = null) {
    const session = getSession();
    if (!session) {
      const page = location.pathname.split('/').pop() || 'index.html';
      const next = encodeURIComponent(`${page}${location.search}`);
      location.href = `login.html?next=${next}`;
      return null;
    }
    if (roles) {
      const allowed = Array.isArray(roles) ? roles : [roles];
      if (!allowed.includes(session.role)) {
        location.href = ROLES[session.role]?.home || 'login.html';
        return null;
      }
    }
    return session;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('oton-admin-session');
  }

  async function changePassword(userId, currentPassword, nextPassword) {
    await ensureUsersSeeded();
    const db = await openDb();
    const readTx = db.transaction('users', 'readonly');
    const user = await req(readTx.objectStore('users').get(userId));
    await txDone(readTx);
    if (!user) throw new Error('Usuário não encontrado.');

    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== user.passwordHash) {
      throw new Error('Senha atual incorreta.');
    }

    const passwordHash = await hashPassword(nextPassword);
    const writeTx = db.transaction('users', 'readwrite');
    writeTx.objectStore('users').put({
      ...user,
      passwordHash,
      updatedAt: Date.now()
    });
    await txDone(writeTx);
    return publicUser(user);
  }

  function roleHome(role) {
    return ROLES[role]?.home || 'login.html';
  }

  async function getBiography() {
    const db = await openDb();
    const tx = db.transaction('meta', 'readonly');
    const saved = await req(tx.objectStore('meta').get('biography'));
    await txDone(tx);
    const data = saved?.value || DEFAULT_BIOGRAPHY;
    let photoUrl = '';
    if (data.photoBlob) {
      photoUrl = URL.createObjectURL(data.photoBlob);
    }
    return {
      name: data.name || DEFAULT_BIOGRAPHY.name,
      title: data.title || DEFAULT_BIOGRAPHY.title,
      text: data.text || DEFAULT_BIOGRAPHY.text,
      photoBlob: data.photoBlob || null,
      photoUrl
    };
  }

  async function saveBiography({ name, title, text, photoBlob, keepPhoto = true }) {
    const db = await openDb();
    const current = await getBiography();
    const nextPhoto = photoBlob || (keepPhoto ? current.photoBlob : null);
    const record = {
      name: String(name || '').trim() || DEFAULT_BIOGRAPHY.name,
      title: String(title || '').trim() || DEFAULT_BIOGRAPHY.title,
      text: String(text || '').trim(),
      photoBlob: nextPhoto || null,
      updatedAt: Date.now()
    };
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'biography', value: record });
    await txDone(tx);
    return getBiography();
  }

  function normalizeNavItems(items) {
    const list = Array.isArray(items) ? items : [];
    return list
      .map((item, index) => ({
        id: String(item?.id || `nav-${index + 1}`),
        label: String(item?.label || '').trim(),
        href: String(item?.href || '').trim()
      }))
      .filter((item) => item.label && item.href);
  }

  async function getNavigation() {
    const db = await openDb();
    const tx = db.transaction('meta', 'readonly');
    const saved = await req(tx.objectStore('meta').get('navigation'));
    await txDone(tx);
    const items = normalizeNavItems(saved?.value);
    return items.length ? items : DEFAULT_NAVIGATION.map((item) => ({ ...item }));
  }

  async function saveNavigation(items) {
    const normalized = normalizeNavItems(items);
    if (!normalized.length) {
      throw new Error('Adicione pelo menos um botão no menu.');
    }
    const db = await openDb();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({
      key: 'navigation',
      value: normalized.map((item, index) => ({
        id: item.id || `nav-${index + 1}`,
        label: item.label,
        href: item.href
      }))
    });
    await txDone(tx);
    return getNavigation();
  }

  function hydrateOfficePhotos(photos = []) {
    return photos.map((photo) => {
      const url = photo.blob ? URL.createObjectURL(photo.blob) : (photo.url || '');
      return {
        id: photo.id,
        name: photo.name || 'Foto',
        blob: photo.blob || null,
        url
      };
    });
  }

  async function getOfficeShowcase() {
    const db = await openDb();
    const tx = db.transaction('meta', 'readonly');
    const saved = await req(tx.objectStore('meta').get('officeShowcase'));
    await txDone(tx);
    const data = saved?.value || DEFAULT_OFFICE_SHOWCASE;
    const photos = hydrateOfficePhotos(Array.isArray(data.photos) ? data.photos : []);
    const coverId = data.coverId && photos.some((photo) => photo.id === data.coverId)
      ? data.coverId
      : (photos[0]?.id || null);
    const cover = photos.find((photo) => photo.id === coverId) || null;
    return {
      title: String(data.title || '').trim() || DEFAULT_OFFICE_SHOWCASE.title,
      text: String(data.text || '').trim() || DEFAULT_OFFICE_SHOWCASE.text,
      coverId,
      photos,
      coverUrl: cover?.url || ''
    };
  }

  async function saveOfficeShowcase({ title, text, photos = [], coverId = null }) {
    const normalizedPhotos = (Array.isArray(photos) ? photos : [])
      .map((photo, index) => ({
        id: String(photo.id || uid('office')),
        name: String(photo.name || `Foto ${index + 1}`),
        blob: photo.blob || null
      }))
      .filter((photo) => photo.blob);

    const nextCoverId = coverId && normalizedPhotos.some((photo) => photo.id === coverId)
      ? coverId
      : (normalizedPhotos[0]?.id || null);

    const record = {
      title: String(title || '').trim() || DEFAULT_OFFICE_SHOWCASE.title,
      text: String(text || '').trim() || DEFAULT_OFFICE_SHOWCASE.text,
      coverId: nextCoverId,
      photos: normalizedPhotos,
      updatedAt: Date.now()
    };

    const db = await openDb();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'officeShowcase', value: record });
    await txDone(tx);
    return getOfficeShowcase();
  }

  async function ensureSeeded() {
    const db = await openDb();
    const metaTx = db.transaction('meta', 'readonly');
    const seeded = await req(metaTx.objectStore('meta').get('seeded'));
    await txDone(metaTx);
    if (seeded?.value) return;

    const write = db.transaction(['meta', 'properties', 'photos'], 'readwrite');
    const props = write.objectStore('properties');
    const photos = write.objectStore('photos');
    const now = Date.now();

    for (const item of SEED) {
      const photoIds = [];
      (item.photos || []).forEach((photo, index) => {
        const id = uid('ph');
        photoIds.push(id);
        photos.put({
          id,
          propertyId: item.id,
          order: index,
          source: photo.source,
          url: photo.url || null,
          blob: null,
          name: `foto-${index + 1}.jpg`
        });
      });
      props.put({
        id: item.id,
        title: item.title,
        type: item.type,
        deal: item.deal,
        neighborhood: item.neighborhood,
        city: item.city,
        price: item.price,
        area: item.area,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        suites: item.suites || 0,
        parking: item.parking,
        description: item.description || '',
        featured: Boolean(item.featured),
        photoIds,
        createdAt: now,
        updatedAt: now
      });
    }
    write.objectStore('meta').put({ key: 'seeded', value: true });
    await txDone(write);
  }

  async function listProperties() {
    await ensureSeeded();
    const db = await openDb();
    const tx = db.transaction('properties', 'readonly');
    const all = await req(tx.objectStore('properties').getAll());
    await txDone(tx);
    return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  async function getProperty(id) {
    await ensureSeeded();
    const db = await openDb();
    const tx = db.transaction(['properties', 'photos'], 'readonly');
    const property = await req(tx.objectStore('properties').get(id));
    if (!property) {
      await txDone(tx);
      return null;
    }
    const photoIndex = tx.objectStore('photos').index('propertyId');
    const photos = await req(photoIndex.getAll(id));
    await txDone(tx);
    photos.sort((a, b) => a.order - b.order);
    return { ...property, photos };
  }

  async function nextCode() {
    const all = await listProperties();
    let max = 0;
    all.forEach((item) => {
      const match = String(item.id).match(/(\d+)$/);
      if (match) max = Math.max(max, Number(match[1]));
    });
    return `OR-${String(max + 1).padStart(3, '0')}`;
  }

  /**
   * Salva imóvel + galeria ordenada.
   * photosDraft: [{ id?, blob?, name?, source?, url? }]
   * Aceita 20+ imagens sem problema (Blobs no IndexedDB).
   */
  async function saveProperty(data, photosDraft = []) {
    await ensureSeeded();
    const db = await openDb();
    const id = data.id || await nextCode();
    const existing = data.id ? await getProperty(id) : null;
    const now = Date.now();
    const oldPhotos = existing?.photos || [];
    const oldMap = new Map(oldPhotos.map((photo) => [photo.id, photo]));

    const finalPhotos = [];
    photosDraft.forEach((item, index) => {
      if (item.id && oldMap.has(item.id)) {
        const current = oldMap.get(item.id);
        finalPhotos.push({
          ...current,
          order: index,
          propertyId: id
        });
        return;
      }
      if (item.blob) {
        finalPhotos.push({
          id: uid('ph'),
          propertyId: id,
          order: index,
          source: 'blob',
          url: null,
          blob: item.blob,
          name: item.name || `foto-${index + 1}.jpg`
        });
        return;
      }
      if (item.source === 'url' && item.url) {
        finalPhotos.push({
          id: item.id || uid('ph'),
          propertyId: id,
          order: index,
          source: 'url',
          url: item.url,
          blob: null,
          name: item.name || `foto-${index + 1}.jpg`
        });
      }
    });

    const keepIds = finalPhotos.map((photo) => photo.id);
    const keepSet = new Set(keepIds);

    const tx = db.transaction(['properties', 'photos'], 'readwrite');
    const props = tx.objectStore('properties');
    const photos = tx.objectStore('photos');

    oldPhotos.forEach((photo) => {
      if (!keepSet.has(photo.id)) photos.delete(photo.id);
    });
    finalPhotos.forEach((photo) => photos.put(photo));

    const record = {
      id,
      title: String(data.title || '').trim(),
      type: data.type,
      deal: data.deal,
      neighborhood: String(data.neighborhood || '').trim(),
      city: String(data.city || 'Tiros').trim(),
      price: Number(data.price) || 0,
      area: Number(data.area) || 0,
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      suites: Number(data.suites) || 0,
      parking: Number(data.parking) || 0,
      condoName: String(data.condoName || '').trim(),
      condoFee: Number(data.condoFee) || 0,
      description: String(data.description || '').trim(),
      featured: Boolean(data.featured),
      photoIds: keepIds,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    props.put(record);
    await txDone(tx);
    return getProperty(id);
  }

  async function deleteProperty(id) {
    await ensureSeeded();
    const property = await getProperty(id);
    if (!property) return;
    const db = await openDb();
    const tx = db.transaction(['properties', 'photos'], 'readwrite');
    tx.objectStore('properties').delete(id);
    (property.photos || []).forEach((photo) => tx.objectStore('photos').delete(photo.id));
    await txDone(tx);
  }

  function photoToUrl(photo) {
    if (!photo) return '';
    if (photo.source === 'url' && photo.url) return photo.url;
    if (photo.blob) return URL.createObjectURL(photo.blob);
    if (photo.url) return photo.url;
    return '';
  }

  async function listPublicProperties() {
    const all = await listProperties();
    const hydrated = [];
    for (const item of all) {
      const full = await getProperty(item.id);
      const photos = (full.photos || []).map((photo) => ({
        id: photo.id,
        url: photoToUrl(photo),
        name: photo.name
      }));
      hydrated.push({
        ...full,
        image: photos[0]?.url || '',
        photos
      });
    }
    return hydrated;
  }

  /**
   * Comprime imagem mantendo boa qualidade para anúncio.
   * Aceita dezenas de fotos sem estourar o armazenamento local.
   */
  async function compressImage(file, { maxWidth = 1600, quality = 0.78 } = {}) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo inválido. Envie apenas imagens.');
    }
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * ratio);
    const height = Math.round(bitmap.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
    });

    return {
      blob,
      name: file.name.replace(/\.\w+$/, '.jpg'),
      previewUrl: URL.createObjectURL(blob)
    };
  }

  return {
    MIN_PHOTO_SLOTS,
    ROLES,
    listProperties,
    listPublicProperties,
    getProperty,
    saveProperty,
    deleteProperty,
    nextCode,
    photoToUrl,
    compressImage,
    isAuthenticated,
    login,
    logout,
    getSession,
    requireAuth,
    changePassword,
    roleHome,
    ensureUsersSeeded,
    getBiography,
    saveBiography,
    getNavigation,
    saveNavigation,
    getOfficeShowcase,
    saveOfficeShowcase,
    DEFAULT_NAVIGATION,
    uid
  };
})();
