/**
 * Camada de dados local (IndexedDB) para o site Óton Rodrigo.
 * Armazena imóveis e fotos (Blob) no navegador.
 */
const OtonStore = (() => {
  const DB_NAME = 'oton-imoveis';
  const DB_VERSION = 1;
  const AUTH_KEY = 'oton-admin-session';
  const PASS_KEY = 'oton-admin-pass';
  const DEFAULT_PASS = 'oton2026';
  const MIN_PHOTO_SLOTS = 20;

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
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function getPassword() {
    return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
  }

  function setPassword(next) {
    localStorage.setItem(PASS_KEY, next);
  }

  function login(password) {
    if (password === getPassword()) {
      sessionStorage.setItem(AUTH_KEY, '1');
      return true;
    }
    return false;
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
    DEFAULT_PASS,
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
    getPassword,
    setPassword,
    uid
  };
})();
