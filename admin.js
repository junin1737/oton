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
    return property.deal === 'aluguel' ? `R$ ${value}/mês` : `R$ ${value}`;
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
    return cache.filter((item) => {
      if (deal && item.deal !== deal) return false;
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
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${coverUrl ? `<img class="thumb" src="${coverUrl}" alt="" />` : '—'}</td>
        <td><strong>${item.id}</strong></td>
        <td>
          <div>${item.title}</div>
          <small style="color:#7a8791">${item.neighborhood} · ${item.city}/MG</small>
        </td>
        <td>${item.type}</td>
        <td><span class="badge ${item.deal === 'aluguel' ? 'rent' : ''}">${item.deal === 'aluguel' ? 'Aluguel' : 'Venda'}</span></td>
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
  }

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
    resetForm();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelector('#reset-btn').addEventListener('click', resetForm);
  document.querySelector('#search-list').addEventListener('input', renderList);
  document.querySelector('#filter-deal').addEventListener('change', renderList);

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
      await loadProperty(editId);
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

  showApp();
})();
