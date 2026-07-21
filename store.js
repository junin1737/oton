/**
 * Cliente da API Óton (Turso via Cloudflare Worker).
 * Mantém a mesma interface usada por admin.js / script.js / login.js.
 */
const OtonStore = (() => {
  const SESSION_KEY = 'oton-session';
  const TOKEN_KEY = 'oton-api-token';
  const MIN_PHOTO_SLOTS = 20;
  const DEFAULT_LOGO_PATH = 'assets/logo-oton.png';

  const ROLES = {
    admin: { id: 'admin', label: 'Administrador', home: 'admin.html' }
  };

  function apiBase() {
    const configured = (typeof window !== 'undefined' && window.OTON_API_URL) || '';
    return String(configured).replace(/\/+$/, '') || 'http://127.0.0.1:8787';
  }

  function getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  function setToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  async function api(path, { method = 'GET', body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${apiBase()}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (error) {
      throw new Error('Não foi possível conectar à API. Verifique se o Worker está no ar.');
    }

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }
    }

    if (!response.ok) {
      throw new Error(data?.error || `Erro na API (${response.status})`);
    }
    return data;
  }

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler imagem'));
      reader.readAsDataURL(blob);
    });
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

  function createSession(user, token) {
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
    if (token) setToken(token);
    return session;
  }

  async function login(email, password) {
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      if (!result?.ok) {
        return { ok: false, error: result?.error || 'E-mail ou senha inválidos.' };
      }
      const session = createSession(result.user, result.token);
      return { ok: true, user: session, home: result.home || ROLES.admin.home };
    } catch (error) {
      return { ok: false, error: error.message || 'Não foi possível entrar.' };
    }
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
    if (!session || !getToken()) return false;
    if (!roles) return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(session.role);
  }

  function requireAuth(roles = null) {
    const session = getSession();
    if (!session || !getToken()) {
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

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', auth: true });
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('oton-admin-session');
    setToken('');
  }

  async function changePassword(userId, currentPassword, nextPassword) {
    void userId;
    await api('/auth/change-password', {
      method: 'POST',
      auth: true,
      body: { currentPassword, nextPassword }
    });
    return getSession();
  }

  function roleHome(role) {
    return ROLES[role]?.home || 'login.html';
  }

  async function ensureUsersSeeded() {
    return true;
  }

  async function getBiography() {
    const data = await api('/biography');
    return {
      name: data.name,
      title: data.title,
      text: data.text,
      photoBlob: null,
      photoUrl: data.photoUrl || data.photoDataUrl || '',
      photoDataUrl: data.photoDataUrl || null
    };
  }

  async function saveBiography({ name, title, text, photoBlob, keepPhoto = true }) {
    let photoDataUrl;
    let clearPhoto = false;
    if (photoBlob) {
      photoDataUrl = await blobToDataUrl(photoBlob);
    } else if (!keepPhoto) {
      clearPhoto = true;
    }
    return api('/biography', {
      method: 'PUT',
      auth: true,
      body: { name, title, text, photoDataUrl, clearPhoto }
    }).then((data) => ({
      name: data.name,
      title: data.title,
      text: data.text,
      photoBlob: null,
      photoUrl: data.photoUrl || data.photoDataUrl || '',
      photoDataUrl: data.photoDataUrl || null
    }));
  }

  async function getNavigation() {
    return api('/navigation');
  }

  async function saveNavigation(items) {
    return api('/navigation', { method: 'PUT', auth: true, body: items });
  }

  async function getFooter() {
    const data = await api('/footer');
    const hideLogo = Boolean(data.hideLogo);
    return {
      ...data,
      hideLogo,
      logoDataUrl: hideLogo ? null : (data.logoDataUrl || null),
      logoUrl: hideLogo ? '' : (data.logoUrl || data.logoDataUrl || DEFAULT_LOGO_PATH)
    };
  }

  async function saveFooter(payload = {}) {
    const body = { ...payload };
    if (payload.logoBlob) {
      body.logoDataUrl = await blobToDataUrl(payload.logoBlob);
      body.hideLogo = false;
      body.removeLogo = false;
    }
    delete body.logoBlob;
    delete body.logoUrl;
    const data = await api('/footer', { method: 'PUT', auth: true, body });
    const hideLogo = Boolean(data.hideLogo);
    return {
      ...data,
      hideLogo,
      logoDataUrl: hideLogo ? null : (data.logoDataUrl || null),
      logoUrl: hideLogo ? '' : (data.logoUrl || data.logoDataUrl || DEFAULT_LOGO_PATH)
    };
  }

  async function getOfficeShowcase() {
    const data = await api('/office');
    return {
      ...data,
      photos: (data.photos || []).map((photo) => ({
        id: photo.id,
        url: photo.url || photo.dataUrl || '',
        name: photo.name || '',
        blob: null
      }))
    };
  }

  async function saveOfficeShowcase({ title, text, photos = [], coverId = null, intervalSeconds = 5 }) {
    const normalized = [];
    for (const photo of photos) {
      let url = photo.url || '';
      if (photo.blob) {
        url = await blobToDataUrl(photo.blob);
      }
      if (!url) continue;
      normalized.push({
        id: photo.id || uid('office'),
        url,
        name: photo.name || 'foto.jpg'
      });
    }
    return api('/office', {
      method: 'PUT',
      auth: true,
      body: { title, text, coverId, intervalSeconds, photos: normalized }
    }).then((data) => ({
      ...data,
      photos: (data.photos || []).map((photo) => ({
        id: photo.id,
        url: photo.url,
        name: photo.name,
        blob: null
      }))
    }));
  }

  async function getSiteVisual() {
    const data = await api('/site-visual');
    return {
      intervalSeconds: data.intervalSeconds,
      logoUrl: data.logoUrl || DEFAULT_LOGO_PATH,
      logoBlob: null,
      banners: (data.banners || []).map((item) => ({
        id: item.id,
        source: item.source || (String(item.url || '').startsWith('data:') ? 'data' : 'url'),
        url: item.url || item.dataUrl || '',
        name: item.name || '',
        blob: null
      }))
    };
  }

  async function saveSiteVisual({ logoBlob = null, keepLogo = true, banners = [], intervalSeconds = 6 } = {}) {
    let logoDataUrl;
    let clearLogo = false;
    if (logoBlob) {
      logoDataUrl = await blobToDataUrl(logoBlob);
    } else if (!keepLogo) {
      clearLogo = true;
    }

    const normalizedBanners = [];
    for (const item of banners) {
      let url = item.url || '';
      if (item.blob) url = await blobToDataUrl(item.blob);
      if (!url) continue;
      normalizedBanners.push({
        id: item.id || uid('banner'),
        source: url.startsWith('data:') ? 'data' : 'url',
        url,
        name: item.name || 'banner.jpg'
      });
    }

    const saved = await api('/site-visual', {
      method: 'PUT',
      auth: true,
      body: { logoDataUrl, clearLogo, banners: normalizedBanners, intervalSeconds }
    });

    return {
      intervalSeconds: saved.intervalSeconds,
      logoUrl: saved.logoUrl || DEFAULT_LOGO_PATH,
      logoBlob: null,
      banners: (saved.banners || []).map((item) => ({
        id: item.id,
        source: item.source || 'url',
        url: item.url,
        name: item.name,
        blob: null
      }))
    };
  }

  async function listProperties() {
    return api('/properties', { auth: true });
  }

  async function getProperty(id) {
    return api(`/properties/${encodeURIComponent(id)}`, { auth: true });
  }

  async function nextCode() {
    const data = await api('/properties/next-code', { auth: true });
    return data.code;
  }

  async function saveProperty(data, photosDraft = []) {
    const photos = [];
    for (const item of photosDraft) {
      let url = item.url || '';
      if (item.blob) url = await blobToDataUrl(item.blob);
      if (!url && item.existing && item.id) {
        // foto já existente sem blob — precisa da url atual
        url = item.url || '';
      }
      if (!url) continue;
      photos.push({
        id: item.id && !String(item.id).startsWith('local-') ? item.id : undefined,
        url,
        name: item.name || 'foto.jpg'
      });
    }

    return api('/properties', {
      method: 'POST',
      auth: true,
      body: { ...data, photos }
    });
  }

  async function deleteProperty(id) {
    await api(`/properties/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
  }

  function photoToUrl(photo) {
    if (!photo) return '';
    if (photo.url) return photo.url;
    if (photo.blob) return URL.createObjectURL(photo.blob);
    return '';
  }

  async function listPublicProperties() {
    return api('/properties/public');
  }

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
    getSiteVisual,
    saveSiteVisual,
    getFooter,
    saveFooter,
    DEFAULT_NAVIGATION: [],
    DEFAULT_LOGO_PATH,
    uid
  };
})();
