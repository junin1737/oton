(() => {
  const session = OtonStore.requireAuth('admin');
  if (!session) return;

  const appView = document.querySelector('#app-view');
  const form = document.querySelector('#property-form');
  const tbody = document.querySelector('#properties-tbody');
  const emptyList = document.querySelector('#empty-list');
  const photoGrid = document.querySelector('#photo-grid');
  const photoInput = document.querySelector('#photo-input');
  const dropzone = document.querySelector('#dropzone');
  const photoCountEl = document.querySelector('#photo-count');
  const photoSlotsEl = document.querySelector('#photo-slots');
  const toastEl = document.querySelector('#toast');
  const formTitle = document.querySelector('#form-title');
  const deleteBtn = document.querySelector('#delete-btn');
  const MIN_SLOTS = OtonStore.MIN_PHOTO_SLOTS;

  appView.hidden = false;
  document.querySelector('#admin-user-label').textContent = `${session.name} · ${session.email}`;

  /** @type {{id:string,url:string,name:string,blob?:Blob,existing?:boolean}[]} */
  let draftPhotos = [];
  let cache = [];
  let objectUrls = [];
  let bioPhotoBlob = null;
  let bioKeepPhoto = true;
  let bioPreviewUrl = '';
  /** @type {{id:string,label:string,href:string}[]} */
  let navDraft = [];
  /** @type {{id:string,url:string,name:string,blob?:Blob}[]} */
  let officePhotos = [];
  let officeCoverId = null;
  let officeUrls = [];

  function toast(message, type = 'ok') {
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toastEl.className = 'toast';
    }, 2800);
  }

  function formatPrice(property) {
    const value = Number(property.price || 0).toLocaleString('pt-BR');
    if (property.deal === 'aluguel') return `R$ ${value}/mês`;
    if (property.deal === 'ambos') return `R$ ${value}`;
    return `R$ ${value}`;
  }

  function dealBadge(deal) {
    if (deal === 'aluguel') return { className: 'rent', label: 'Aluguel' };
    if (deal === 'ambos') return { className: 'both', label: 'Venda e aluguel' };
    return { className: 'sale', label: 'Venda' };
  }

  function statusBadge(status) {
    if (status === 'alugado') return { className: 'rented', label: 'Alugado' };
    if (status === 'vendido') return { className: 'sold', label: 'Vendido' };
    return { className: 'available', label: 'Disponível' };
  }

  function revokeUrls() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
  }

  function trackUrl(url) {
    if (url && url.startsWith('blob:')) objectUrls.push(url);
    return url;
  }

  function updatePhotoMeta() {
    const count = draftPhotos.length;
    photoCountEl.textContent = String(count);
    photoSlotsEl.textContent = String(Math.max(MIN_SLOTS, count));
  }

  function renderPhotos() {
    updatePhotoMeta();
    if (!draftPhotos.length) {
      photoGrid.innerHTML = '<div class="empty">Nenhuma foto adicionada ainda. Anexe pelo menos as imagens principais do imóvel.</div>';
      return;
    }

    photoGrid.innerHTML = draftPhotos.map((photo, index) => `
      <article class="photo-item" data-index="${index}">
        <img src="${photo.url}" alt="${photo.name || `Foto ${index + 1}`}" />
        ${index === 0 ? '<span class="cover-tag">CAPA</span>' : ''}
        <div class="ops">
          <button type="button" data-act="left" title="Mover para esquerda">←</button>
          <button type="button" data-act="right" title="Mover para direita">→</button>
          <button type="button" data-act="remove" title="Remover">✕</button>
        </div>
      </article>
    `).join('');
  }

  async function addFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!files.length) {
      toast('Selecione arquivos de imagem válidos.', 'err');
      return;
    }

    const saveBtn = document.querySelector('#save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Processando fotos...';

    try {
      for (const file of files) {
        const compressed = await OtonStore.compressImage(file);
        trackUrl(compressed.previewUrl);
        draftPhotos.push({
          id: OtonStore.uid('local'),
          url: compressed.previewUrl,
          name: compressed.name,
          blob: compressed.blob,
          existing: false
        });
      }
      renderPhotos();
      toast(`${files.length} foto(s) adicionada(s). Capacidade atual: ${Math.max(MIN_SLOTS, draftPhotos.length)} slots.`);
    } catch (error) {
      console.error(error);
      toast(error.message || 'Falha ao processar imagens.', 'err');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar imóvel';
      photoInput.value = '';
    }
  }

  function resetForm() {
    form.reset();
    form.id.value = '';
    form.idDisplay.value = '';
    form.city.value = 'Tiros';
    form.status.value = 'disponivel';
    form.featured.checked = false;
    draftPhotos = [];
    revokeUrls();
    renderPhotos();
    formTitle.textContent = 'Cadastrar imóvel';
    deleteBtn.hidden = true;
  }

  async function loadProperty(id) {
    const property = await OtonStore.getProperty(id);
    if (!property) {
      toast('Imóvel não encontrado.', 'err');
      return;
    }

    form.id.value = property.id;
    form.idDisplay.value = property.id;
    form.title.value = property.title || '';
    form.deal.value = property.deal || 'venda';
    form.status.value = property.status || 'disponivel';
    form.type.value = property.type || 'Casa';
    form.neighborhood.value = property.neighborhood || '';
    form.city.value = property.city || 'Tiros';
    form.price.value = property.price || 0;
    form.area.value = property.area || 0;
    form.bedrooms.value = property.bedrooms || 0;
    form.suites.value = property.suites || 0;
    form.bathrooms.value = property.bathrooms || 0;
    form.parking.value = property.parking || 0;
    form.condoName.value = property.condoName || '';
    form.condoFee.value = property.condoFee || '';
    form.description.value = property.description || '';
    form.featured.checked = Boolean(property.featured);

    revokeUrls();
    draftPhotos = (property.photos || []).map((photo) => {
      const url = trackUrl(OtonStore.photoToUrl(photo));
      return {
        id: photo.id,
        url,
        name: photo.name,
        blob: photo.blob || null,
        existing: true,
        source: photo.source,
        originalUrl: photo.url || null
      };
    });

    formTitle.textContent = `Editar ${property.id}`;
    deleteBtn.hidden = false;
    renderPhotos();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function filteredList() {
    const term = document.querySelector('#search-list').value.trim().toLowerCase();
    const deal = document.querySelector('#filter-deal').value;
    const status = document.querySelector('#filter-status').value;
    return cache.filter((item) => {
      if (deal === 'venda') return item.deal === 'venda' || item.deal === 'ambos';
      if (deal === 'aluguel') return item.deal === 'aluguel' || item.deal === 'ambos';
      if (deal === 'ambos') return item.deal === 'ambos';
      return true;
    }).filter((item) => {
      if (!status) return true;
      return (item.status || 'disponivel') === status;
    }).filter((item) => {
      if (!term) return true;
      const hay = `${item.id} ${item.title} ${item.neighborhood} ${item.city} ${item.type}`.toLowerCase();
      return hay.includes(term);
    });
  }

  async function renderList() {
    cache = await OtonStore.listProperties();
    const list = filteredList();
    emptyList.hidden = list.length > 0;
    tbody.innerHTML = '';

    for (const item of list) {
      const full = await OtonStore.getProperty(item.id);
      const cover = full.photos?.[0];
      const coverUrl = cover ? OtonStore.photoToUrl(cover) : '';
      const badge = dealBadge(item.deal);
      const status = statusBadge(item.status || 'disponivel');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${coverUrl ? `<img class="thumb" src="${coverUrl}" alt="" />` : '—'}</td>
        <td><strong>${item.id}</strong></td>
        <td>
          <div>${item.title}</div>
          <small style="color:#7a8791">${item.neighborhood} · ${item.city}/MG</small>
        </td>
        <td>${item.type}</td>
        <td><span class="badge ${badge.className}">${badge.label}</span></td>
        <td><span class="badge ${status.className}">${status.label}</span></td>
        <td>${formatPrice(item)}</td>
        <td>${full.photos?.length || 0}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-line" type="button" data-edit="${item.id}">Editar</button>
            <button class="btn btn-danger" type="button" data-del="${item.id}">Excluir</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  async function saveProperty(event) {
    event.preventDefault();
    if (draftPhotos.length < 1) {
      toast('Adicione pelo menos 1 foto do imóvel.', 'err');
      return;
    }

    const saveBtn = document.querySelector('#save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    try {
      const payload = {
        id: form.id.value || null,
        title: form.title.value,
        deal: form.deal.value,
        status: form.status.value,
        type: form.type.value,
        neighborhood: form.neighborhood.value,
        city: form.city.value,
        price: form.price.value,
        area: form.area.value,
        bedrooms: form.bedrooms.value,
        suites: form.suites.value,
        bathrooms: form.bathrooms.value,
        parking: form.parking.value,
        condoName: form.condoName.value,
        condoFee: form.condoFee.value,
        description: form.description.value,
        featured: form.featured.checked
      };

      const photosDraft = draftPhotos.map((photo) => {
        if (photo.existing) {
          return {
            id: photo.id,
            source: photo.source,
            url: photo.originalUrl || null,
            name: photo.name
          };
        }
        return {
          blob: photo.blob,
          name: photo.name
        };
      });

      const saved = await OtonStore.saveProperty(payload, photosDraft);
      toast(`Imóvel ${saved.id} salvo com ${draftPhotos.length} foto(s).`);
      resetForm();
      await renderList();
    } catch (error) {
      console.error(error);
      toast('Não foi possível salvar o imóvel.', 'err');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar imóvel';
    }
  }

  function showApp() {
    resetForm();
    renderList();
    loadBiographyForm();
    loadOfficeShowcaseForm();
    loadSiteVisualForm();
    loadNavigationForm();
  }

  function switchAdminTab(tabId) {
    const next = String(tabId || 'imoveis');
    document.querySelectorAll('.admin-tab').forEach((tab) => {
      const active = tab.dataset.tab === next;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const active = panel.dataset.tabPanel === next;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    if (next === 'imoveis') {
      history.replaceState(null, '', '#imoveis');
    } else {
      history.replaceState(null, '', `#${next}`);
    }
  }

  document.querySelector('.admin-tabs')?.addEventListener('click', (event) => {
    const tab = event.target.closest('.admin-tab');
    if (!tab) return;
    switchAdminTab(tab.dataset.tab);
  });

  const bioForm = document.querySelector('#biography-form');
  const bioPreview = document.querySelector('#bio-photo-preview');
  const bioPhotoInput = document.querySelector('#bio-photo-input');
  const bioPhotoRemove = document.querySelector('#bio-photo-remove');
  const navItemsEl = document.querySelector('#nav-items');
  const navAddBtn = document.querySelector('#nav-add-btn');
  const navSaveBtn = document.querySelector('#nav-save-btn');
  const officeForm = document.querySelector('#office-showcase-form');
  const officeDropzone = document.querySelector('#office-dropzone');
  const officePhotoInput = document.querySelector('#office-photo-input');
  const officePhotoGrid = document.querySelector('#office-photo-grid');
  const officePhotoCount = document.querySelector('#office-photo-count');
  const officeSaveBtn = document.querySelector('#office-save-btn');
  const visualForm = document.querySelector('#site-visual-form');
  const logoPreview = document.querySelector('#logo-preview');
  const logoInput = document.querySelector('#logo-input');
  const logoRemove = document.querySelector('#logo-remove');
  const bannerDropzone = document.querySelector('#banner-dropzone');
  const bannerPhotoInput = document.querySelector('#banner-photo-input');
  const bannerPhotoGrid = document.querySelector('#banner-photo-grid');
  const bannerPhotoCount = document.querySelector('#banner-photo-count');
  const visualSaveBtn = document.querySelector('#visual-save-btn');
  /** @type {{id:string,url:string,name:string,blob?:Blob,source?:string}[]} */
  let bannerPhotos = [];
  let logoBlob = null;
  let logoKeep = true;
  let logoPreviewUrl = '';
  let bannerUrls = [];

  function trackBannerUrl(url) {
    if (url && String(url).startsWith('blob:')) bannerUrls.push(url);
  }

  function revokeBannerUrls() {
    bannerUrls.forEach((url) => URL.revokeObjectURL(url));
    bannerUrls = [];
  }

  function renderLogoPreview(url) {
    if (url) {
      logoPreview.innerHTML = `<img src="${url}" alt="Logo do site" />`;
      logoRemove.hidden = String(url).includes('assets/logo-oton.png');
    } else {
      logoPreview.innerHTML = '<span>Sem logo</span>';
      logoRemove.hidden = true;
    }
  }

  function renderBannerPhotos() {
    bannerPhotoCount.textContent = `${bannerPhotos.length} banner${bannerPhotos.length === 1 ? '' : 's'}`;
    if (!bannerPhotos.length) {
      bannerPhotoGrid.innerHTML = '<div class="empty">Nenhum banner. Sem fotos, o site usa o banner padrão.</div>';
      return;
    }
    bannerPhotoGrid.innerHTML = bannerPhotos.map((photo, index) => `
      <article class="photo-item" data-index="${index}">
        <img src="${photo.url}" alt="${photo.name || `Banner ${index + 1}`}" />
        ${index === 0 ? '<span class="cover-tag">1º</span>' : ''}
        <div class="ops">
          <button type="button" data-act="left" title="Mover para esquerda">←</button>
          <button type="button" data-act="right" title="Mover para direita">→</button>
          <button type="button" data-act="remove" title="Remover">✕</button>
        </div>
      </article>
    `).join('');
  }

  async function addBannerFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!files.length) {
      toast('Selecione arquivos de imagem válidos.', 'err');
      return;
    }
    visualSaveBtn.disabled = true;
    visualSaveBtn.textContent = 'Processando banners...';
    try {
      for (const file of files) {
        const compressed = await OtonStore.compressImage(file, { maxWidth: 2000, quality: 0.82 });
        trackBannerUrl(compressed.previewUrl);
        bannerPhotos.push({
          id: OtonStore.uid('banner'),
          url: compressed.previewUrl,
          name: compressed.name,
          blob: compressed.blob,
          source: 'blob'
        });
      }
      renderBannerPhotos();
      toast(`${files.length} banner(s) adicionado(s).`);
    } catch (error) {
      console.error(error);
      toast(error.message || 'Falha ao processar imagens.', 'err');
    } finally {
      visualSaveBtn.disabled = false;
      visualSaveBtn.textContent = 'Salvar banner e logo';
      bannerPhotoInput.value = '';
    }
  }

  async function loadSiteVisualForm() {
    try {
      const data = await OtonStore.getSiteVisual();
      visualForm.intervalSeconds.value = data.intervalSeconds || 6;
      logoBlob = null;
      logoKeep = Boolean(data.logoBlob);
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl);
      logoPreviewUrl = data.logoBlob ? data.logoUrl : '';
      renderLogoPreview(logoPreviewUrl || data.logoUrl || OtonStore.DEFAULT_LOGO_PATH);

      revokeBannerUrls();
      bannerPhotos = (data.banners || []).map((item) => {
        trackBannerUrl(item.url);
        return {
          id: item.id,
          url: item.url,
          name: item.name,
          blob: item.blob || null,
          source: item.source || (item.blob ? 'blob' : 'url')
        };
      });
      renderBannerPhotos();
    } catch (error) {
      console.error(error);
      toast('Não foi possível carregar banner/logo.', 'err');
    }
  }

  logoInput.addEventListener('change', async () => {
    const file = logoInput.files?.[0];
    if (!file) return;
    try {
      const compressed = await OtonStore.compressImage(file, { maxWidth: 900, quality: 0.9 });
      logoBlob = compressed.blob;
      logoKeep = true;
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl);
      logoPreviewUrl = compressed.previewUrl;
      renderLogoPreview(logoPreviewUrl);
    } catch (error) {
      toast(error.message || 'Falha ao processar a logo.', 'err');
    } finally {
      logoInput.value = '';
    }
  });

  logoRemove.addEventListener('click', () => {
    logoBlob = null;
    logoKeep = false;
    if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = '';
    renderLogoPreview(OtonStore.DEFAULT_LOGO_PATH);
  });

  bannerDropzone.addEventListener('click', (event) => {
    if (event.target === bannerPhotoInput) return;
    bannerPhotoInput.click();
  });
  bannerPhotoInput.addEventListener('change', () => addBannerFiles(bannerPhotoInput.files || []));
  ['dragenter', 'dragover'].forEach((type) => {
    bannerDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      bannerDropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((type) => {
    bannerDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      bannerDropzone.classList.remove('dragover');
    });
  });
  bannerDropzone.addEventListener('drop', (event) => {
    addBannerFiles(event.dataTransfer.files || []);
  });

  bannerPhotoGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-act]');
    const item = event.target.closest('.photo-item');
    if (!button || !item) return;
    const index = Number(item.dataset.index);
    const act = button.dataset.act;
    if (act === 'remove') bannerPhotos.splice(index, 1);
    if (act === 'left' && index > 0) {
      const [photo] = bannerPhotos.splice(index, 1);
      bannerPhotos.splice(index - 1, 0, photo);
    }
    if (act === 'right' && index < bannerPhotos.length - 1) {
      const [photo] = bannerPhotos.splice(index, 1);
      bannerPhotos.splice(index + 1, 0, photo);
    }
    renderBannerPhotos();
  });

  visualForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    visualSaveBtn.disabled = true;
    visualSaveBtn.textContent = 'Salvando...';
    try {
      const saved = await OtonStore.saveSiteVisual({
        logoBlob,
        keepLogo: logoKeep,
        intervalSeconds: visualForm.intervalSeconds.value,
        banners: bannerPhotos
      });
      toast('Banner e logo salvos. Confira na página inicial.');
      await loadSiteVisualForm();
      void saved;
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível salvar banner/logo.', 'err');
    } finally {
      visualSaveBtn.disabled = false;
      visualSaveBtn.textContent = 'Salvar banner e logo';
    }
  });

  function trackOfficeUrl(url) {
    if (url) officeUrls.push(url);
  }

  function revokeOfficeUrls() {
    officeUrls.forEach((url) => URL.revokeObjectURL(url));
    officeUrls = [];
  }

  function renderOfficePhotos() {
    officePhotoCount.textContent = `${officePhotos.length} foto${officePhotos.length === 1 ? '' : 's'}`;
    if (!officePhotos.length) {
      officePhotoGrid.innerHTML = '<div class="empty">Nenhuma foto do escritório ainda. Adicione imagens e defina a capa.</div>';
      return;
    }

    officePhotoGrid.innerHTML = officePhotos.map((photo, index) => `
      <article class="photo-item" data-index="${index}" data-id="${photo.id}">
        <img src="${photo.url}" alt="${photo.name || `Foto ${index + 1}`}" />
        ${photo.id === officeCoverId ? '<span class="cover-tag">CAPA</span>' : ''}
        <div class="ops">
          <button type="button" data-act="cover" title="Definir como capa">Capa</button>
          <button type="button" data-act="remove" title="Remover">✕</button>
        </div>
      </article>
    `).join('');
  }

  async function addOfficeFiles(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!files.length) {
      toast('Selecione arquivos de imagem válidos.', 'err');
      return;
    }

    officeSaveBtn.disabled = true;
    officeSaveBtn.textContent = 'Processando fotos...';
    try {
      for (const file of files) {
        const compressed = await OtonStore.compressImage(file, { maxWidth: 1400, quality: 0.8 });
        trackOfficeUrl(compressed.previewUrl);
        const id = OtonStore.uid('office');
        officePhotos.push({
          id,
          url: compressed.previewUrl,
          name: compressed.name,
          blob: compressed.blob
        });
        if (!officeCoverId) officeCoverId = id;
      }
      renderOfficePhotos();
      toast(`${files.length} foto(s) do escritório adicionada(s).`);
    } catch (error) {
      console.error(error);
      toast(error.message || 'Falha ao processar imagens.', 'err');
    } finally {
      officeSaveBtn.disabled = false;
      officeSaveBtn.textContent = 'Salvar escritório';
      officePhotoInput.value = '';
    }
  }

  async function loadOfficeShowcaseForm() {
    try {
      const data = await OtonStore.getOfficeShowcase();
      officeForm.title.value = data.title || '';
      officeForm.text.value = data.text || '';
      officeForm.intervalSeconds.value = data.intervalSeconds || 5;
      revokeOfficeUrls();
      officePhotos = (data.photos || []).map((photo) => {
        trackOfficeUrl(photo.url);
        return {
          id: photo.id,
          url: photo.url,
          name: photo.name,
          blob: photo.blob
        };
      });
      officeCoverId = data.coverId || officePhotos[0]?.id || null;
      renderOfficePhotos();
    } catch (error) {
      console.error(error);
      toast('Não foi possível carregar as fotos do escritório.', 'err');
    }
  }

  officeDropzone.addEventListener('click', (event) => {
    if (event.target === officePhotoInput) return;
    officePhotoInput.click();
  });
  officePhotoInput.addEventListener('change', () => addOfficeFiles(officePhotoInput.files || []));

  ['dragenter', 'dragover'].forEach((type) => {
    officeDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      officeDropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((type) => {
    officeDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      officeDropzone.classList.remove('dragover');
    });
  });
  officeDropzone.addEventListener('drop', (event) => {
    addOfficeFiles(event.dataTransfer.files || []);
  });

  officePhotoGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-act]');
    const item = event.target.closest('.photo-item');
    if (!button || !item) return;
    const index = Number(item.dataset.index);
    const photo = officePhotos[index];
    if (!photo) return;
    const act = button.dataset.act;
    if (act === 'cover') {
      officeCoverId = photo.id;
      renderOfficePhotos();
      return;
    }
    if (act === 'remove') {
      officePhotos.splice(index, 1);
      if (officeCoverId === photo.id) {
        officeCoverId = officePhotos[0]?.id || null;
      }
      renderOfficePhotos();
    }
  });

  officeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    officeSaveBtn.disabled = true;
    officeSaveBtn.textContent = 'Salvando...';
    try {
      const saved = await OtonStore.saveOfficeShowcase({
        title: officeForm.title.value,
        text: officeForm.text.value,
        intervalSeconds: officeForm.intervalSeconds.value,
        photos: officePhotos,
        coverId: officeCoverId
      });
      revokeOfficeUrls();
      officePhotos = (saved.photos || []).map((photo) => {
        trackOfficeUrl(photo.url);
        return {
          id: photo.id,
          url: photo.url,
          name: photo.name,
          blob: photo.blob
        };
      });
      officeCoverId = saved.coverId || officePhotos[0]?.id || null;
      officeForm.title.value = saved.title || '';
      officeForm.text.value = saved.text || '';
      officeForm.intervalSeconds.value = saved.intervalSeconds || 5;
      renderOfficePhotos();
      toast('Escritório salvo. Confira a capa na página inicial.');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível salvar o escritório.', 'err');
    } finally {
      officeSaveBtn.disabled = false;
      officeSaveBtn.textContent = 'Salvar escritório';
    }
  });

  function escapeAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderNavEditor() {
    if (!navDraft.length) {
      navItemsEl.innerHTML = '<p class="empty" style="margin:0;">Nenhum botão no menu. Adicione pelo menos um.</p>';
      return;
    }

    navItemsEl.innerHTML = navDraft.map((item, index) => `
      <div class="nav-editor-row" data-nav-index="${index}">
        <span class="nav-editor-index">${String(index + 1).padStart(2, '0')}</span>
        <label>
          <span>TEXTO DO BOTÃO</span>
          <input type="text" data-nav-field="label" maxlength="60" value="${escapeAttr(item.label)}" placeholder="Ex.: Contato" />
        </label>
        <label>
          <span>LINK</span>
          <input type="text" data-nav-field="href" maxlength="180" value="${escapeAttr(item.href)}" placeholder="Ex.: index.html#contato" />
        </label>
        <div class="nav-editor-actions">
          <button class="btn btn-line" type="button" data-nav-move="-1" ${index === 0 ? 'disabled' : ''} title="Subir">↑</button>
          <button class="btn btn-line" type="button" data-nav-move="1" ${index === navDraft.length - 1 ? 'disabled' : ''} title="Descer">↓</button>
          <button class="btn btn-danger" type="button" data-nav-remove title="Remover">Remover</button>
        </div>
      </div>
    `).join('');
  }

  function syncNavDraftFromDom() {
    navDraft = [...navItemsEl.querySelectorAll('.nav-editor-row')].map((row, index) => ({
      id: navDraft[index]?.id || `nav-${Date.now()}-${index}`,
      label: row.querySelector('[data-nav-field="label"]')?.value || '',
      href: row.querySelector('[data-nav-field="href"]')?.value || ''
    }));
  }

  async function loadNavigationForm() {
    try {
      navDraft = await OtonStore.getNavigation();
      renderNavEditor();
    } catch (error) {
      console.error(error);
      toast('Não foi possível carregar o menu.', 'err');
    }
  }

  navItemsEl.addEventListener('input', (event) => {
    const field = event.target.getAttribute('data-nav-field');
    if (!field) return;
    const row = event.target.closest('.nav-editor-row');
    const index = Number(row?.dataset.navIndex);
    if (!Number.isInteger(index) || !navDraft[index]) return;
    navDraft[index][field] = event.target.value;
  });

  navItemsEl.addEventListener('click', (event) => {
    const row = event.target.closest('.nav-editor-row');
    if (!row) return;
    const index = Number(row.dataset.navIndex);
    if (!Number.isInteger(index)) return;

    if (event.target.closest('[data-nav-remove]')) {
      syncNavDraftFromDom();
      navDraft.splice(index, 1);
      renderNavEditor();
      return;
    }

    const moveBtn = event.target.closest('[data-nav-move]');
    if (moveBtn) {
      const delta = Number(moveBtn.getAttribute('data-nav-move'));
      const next = index + delta;
      if (next < 0 || next >= navDraft.length) return;
      syncNavDraftFromDom();
      const [item] = navDraft.splice(index, 1);
      navDraft.splice(next, 0, item);
      renderNavEditor();
    }
  });

  navAddBtn.addEventListener('click', () => {
    syncNavDraftFromDom();
    navDraft.push({
      id: `nav-${Date.now()}`,
      label: 'Novo botão',
      href: 'index.html#'
    });
    renderNavEditor();
  });

  navSaveBtn.addEventListener('click', async () => {
    syncNavDraftFromDom();
    navSaveBtn.disabled = true;
    navSaveBtn.textContent = 'Salvando...';
    try {
      navDraft = await OtonStore.saveNavigation(navDraft);
      renderNavEditor();
      toast('Menu salvo. Atualize o site para ver os botões.');
    } catch (error) {
      console.error(error);
      toast(error.message || 'Não foi possível salvar o menu.', 'err');
    } finally {
      navSaveBtn.disabled = false;
      navSaveBtn.textContent = 'Salvar menu';
    }
  });

  function renderBioPreview(url) {
    if (url) {
      bioPreview.innerHTML = `<img src="${url}" alt="Foto da biografia" />`;
      bioPhotoRemove.hidden = false;
    } else {
      bioPreview.innerHTML = '<span>Sem foto</span>';
      bioPhotoRemove.hidden = true;
    }
  }

  async function loadBiographyForm() {
    try {
      const bio = await OtonStore.getBiography();
      bioForm.name.value = bio.name || '';
      bioForm.title.value = bio.title || '';
      bioForm.text.value = bio.text || '';
      bioPhotoBlob = null;
      bioKeepPhoto = Boolean(bio.photoBlob);
      if (bioPreviewUrl) URL.revokeObjectURL(bioPreviewUrl);
      bioPreviewUrl = bio.photoUrl || '';
      renderBioPreview(bioPreviewUrl);
    } catch (error) {
      console.error(error);
      toast('Não foi possível carregar a biografia.', 'err');
    }
  }

  bioPhotoInput.addEventListener('change', async () => {
    const file = bioPhotoInput.files?.[0];
    if (!file) return;
    try {
      const compressed = await OtonStore.compressImage(file, { maxWidth: 900, quality: 0.82 });
      bioPhotoBlob = compressed.blob;
      bioKeepPhoto = true;
      if (bioPreviewUrl) URL.revokeObjectURL(bioPreviewUrl);
      bioPreviewUrl = compressed.previewUrl;
      renderBioPreview(bioPreviewUrl);
    } catch (error) {
      toast(error.message || 'Falha ao processar a foto.', 'err');
    } finally {
      bioPhotoInput.value = '';
    }
  });

  bioPhotoRemove.addEventListener('click', () => {
    bioPhotoBlob = null;
    bioKeepPhoto = false;
    if (bioPreviewUrl) URL.revokeObjectURL(bioPreviewUrl);
    bioPreviewUrl = '';
    renderBioPreview('');
  });

  bioForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const saveBtn = document.querySelector('#bio-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    try {
      await OtonStore.saveBiography({
        name: bioForm.name.value,
        title: bioForm.title.value,
        text: bioForm.text.value,
        photoBlob: bioPhotoBlob,
        keepPhoto: bioKeepPhoto
      });
      toast('Biografia salva. Confira na página inicial.');
      await loadBiographyForm();
    } catch (error) {
      console.error(error);
      toast('Não foi possível salvar a biografia.', 'err');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar biografia';
    }
  });

  document.querySelector('#logout-btn').addEventListener('click', () => {
    OtonStore.logout();
    location.href = 'login.html';
  });

  document.querySelector('#change-pass-btn').addEventListener('click', async () => {
    const current = prompt('Digite a senha atual:');
    if (current === null) return;
    const next = prompt('Digite a nova senha (mín. 4 caracteres):');
    if (!next) return;
    if (next.length < 4) {
      toast('Use pelo menos 4 caracteres.', 'err');
      return;
    }
    try {
      await OtonStore.changePassword(session.userId, current, next);
      toast('Senha atualizada.');
    } catch (error) {
      toast(error.message || 'Não foi possível alterar a senha.', 'err');
    }
  });

  document.querySelector('#new-property-btn').addEventListener('click', () => {
    switchAdminTab('imoveis');
    resetForm();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelector('#reset-btn').addEventListener('click', resetForm);
  document.querySelector('#search-list').addEventListener('input', renderList);
  document.querySelector('#filter-deal').addEventListener('change', renderList);
  document.querySelector('#filter-status').addEventListener('change', renderList);

  form.addEventListener('submit', saveProperty);

  deleteBtn.addEventListener('click', async () => {
    const id = form.id.value;
    if (!id) return;
    if (!confirm(`Excluir o imóvel ${id}? Esta ação não pode ser desfeita.`)) return;
    await OtonStore.deleteProperty(id);
    toast(`Imóvel ${id} excluído.`);
    resetForm();
    renderList();
  });

  tbody.addEventListener('click', async (event) => {
    const editId = event.target.getAttribute('data-edit');
    const delId = event.target.getAttribute('data-del');
    if (editId) {
      switchAdminTab('imoveis');
      await loadProperty(editId);
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (delId) {
      if (!confirm(`Excluir o imóvel ${delId}?`)) return;
      await OtonStore.deleteProperty(delId);
      toast(`Imóvel ${delId} excluído.`);
      if (form.id.value === delId) resetForm();
      renderList();
    }
  });

  document.querySelector('#pick-photos-btn').addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', () => addFiles(photoInput.files || []));

  ['dragenter', 'dragover'].forEach((type) => {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((type) => {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', (event) => {
    addFiles(event.dataTransfer.files || []);
  });

  photoGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-act]');
    const item = event.target.closest('.photo-item');
    if (!button || !item) return;
    const index = Number(item.dataset.index);
    const act = button.dataset.act;
    if (act === 'remove') {
      draftPhotos.splice(index, 1);
    }
    if (act === 'left' && index > 0) {
      const [photo] = draftPhotos.splice(index, 1);
      draftPhotos.splice(index - 1, 0, photo);
    }
    if (act === 'right' && index < draftPhotos.length - 1) {
      const [photo] = draftPhotos.splice(index, 1);
      draftPhotos.splice(index + 1, 0, photo);
    }
    renderPhotos();
  });

  const initialTab = (location.hash || '#imoveis').replace('#', '');
  const allowedTabs = ['imoveis', 'visual', 'biografia', 'escritorio', 'menu'];
  switchAdminTab(allowedTabs.includes(initialTab) ? initialTab : 'imoveis');
  showApp();
})();
