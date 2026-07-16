const WHATSAPP = '5534993112645';

let PROPERTIES = [];

function formatPrice(property) {
  if (!property.price) return 'Consulte o valor';
  const value = property.price.toLocaleString('pt-BR');
  return property.deal === 'aluguel' ? `R$ ${value}/mês` : `R$ ${value}`;
}

function dealLabel(deal) {
  return deal === 'aluguel' ? 'Para alugar' : 'À venda';
}

function buildSpecs(property) {
  const parts = [];
  if (property.area) parts.push(`${property.area.toLocaleString('pt-BR')} m²`);
  if (property.bedrooms) parts.push(`${property.bedrooms} ${property.bedrooms > 1 ? 'quartos' : 'quarto'}`);
  if (property.suites) parts.push(`${property.suites} ${property.suites > 1 ? 'suítes' : 'suíte'}`);
  if (property.bathrooms) parts.push(`${property.bathrooms} ${property.bathrooms > 1 ? 'banheiros' : 'banheiro'}`);
  if (property.parking) parts.push(`${property.parking} ${property.parking > 1 ? 'vagas' : 'vaga'}`);
  return parts.map((part, index) => (index ? `<i></i>${part}` : part)).join('');
}

function condoLine(property) {
  const name = (property.condoName || '').trim();
  const fee = Number(property.condoFee) || 0;
  if (!name && !fee) return '';
  const feeText = fee ? `Cond. R$ ${fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
  if (name && feeText) return `<p class="condo-line">${name} · ${feeText}</p>`;
  if (name) return `<p class="condo-line">${name}</p>`;
  return `<p class="condo-line">${feeText}</p>`;
}

function whatsappLink(property) {
  const text = encodeURIComponent(
    `Olá! Tenho interesse no imóvel ${property.id} — ${property.title} (${property.neighborhood}, ${property.city}/MG).`
  );
  return `https://wa.me/${WHATSAPP}?text=${text}`;
}

function cardHtml(property) {
  const photos = property.photos?.length
    ? property.photos
    : property.image
      ? [{ url: property.image }]
      : [];
  const cover = photos[0]?.url || '';
  const count = photos.length;

  return `
    <article class="card" data-id="${property.id}">
      <button class="photo" type="button" style="background-image:url('${cover}')" data-open-gallery="${property.id}" aria-label="Ver fotos de ${property.title}">
        <span>${dealLabel(property.deal)}</span>
        <span class="code">${property.id}</span>
        ${count > 1 ? `<span class="photo-count">${count} fotos</span>` : ''}
      </button>
      <div class="card-text">
        <small>${property.type.toUpperCase()}</small>
        <h3>${property.title}</h3>
        <p>${property.neighborhood} · ${property.city}/MG</p>
        ${condoLine(property)}
        <strong>${formatPrice(property)}</strong>
        <div class="specs">${buildSpecs(property)}</div>
        <a class="card-whatsapp" href="${whatsappLink(property)}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
      </div>
    </article>
  `;
}

let galleryState = { property: null, index: 0 };

function ensureGallery() {
  let root = document.querySelector('#photo-gallery');
  if (root) return root;

  root = document.createElement('div');
  root.id = 'photo-gallery';
  root.className = 'photo-gallery';
  root.hidden = true;
  root.innerHTML = `
    <div class="photo-gallery-backdrop" data-gallery-close></div>
    <div class="photo-gallery-dialog" role="dialog" aria-modal="true" aria-label="Fotos do imóvel">
      <button class="photo-gallery-close" type="button" data-gallery-close aria-label="Fechar">✕</button>
      <div class="photo-gallery-stage">
        <button class="photo-gallery-nav prev" type="button" data-gallery-prev aria-label="Foto anterior">‹</button>
        <img class="photo-gallery-image" alt="" />
        <button class="photo-gallery-nav next" type="button" data-gallery-next aria-label="Próxima foto">›</button>
      </div>
      <div class="photo-gallery-footer">
        <div class="photo-gallery-info">
          <p class="photo-gallery-counter"></p>
          <h3 class="photo-gallery-title"></h3>
          <p class="photo-gallery-meta"></p>
          <strong class="photo-gallery-price"></strong>
        </div>
        <a class="photo-gallery-whatsapp" href="#" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.7A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.8 1 1-3.7-.2-.3A9 9 0 1 1 12 21Zm5-6.6c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.3 0-.5l-.9-2.1c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3a2.3 2.3 0 0 0-.7 1.7 4 4 0 0 0 .8 2.1 9.2 9.2 0 0 0 3.5 3.4 12 12 0 0 0 2.3.9 3.2 3.2 0 0 0 1.8.1 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c-.1-.1-.3-.2-.5-.3Z"/></svg>
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-gallery-close]')) closeGallery();
    if (event.target.closest('[data-gallery-prev]')) stepGallery(-1);
    if (event.target.closest('[data-gallery-next]')) stepGallery(1);
  });

  document.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    if (event.key === 'Escape') closeGallery();
    if (event.key === 'ArrowLeft') stepGallery(-1);
    if (event.key === 'ArrowRight') stepGallery(1);
  });

  return root;
}

function getPropertyPhotos(property) {
  if (property.photos?.length) return property.photos.filter((p) => p.url);
  if (property.image) return [{ url: property.image }];
  return [];
}

function renderGalleryFrame() {
  const root = ensureGallery();
  const { property, index } = galleryState;
  if (!property) return;

  const photos = getPropertyPhotos(property);
  const photo = photos[index] || photos[0];
  if (!photo) return;

  const image = root.querySelector('.photo-gallery-image');
  const counter = root.querySelector('.photo-gallery-counter');
  const title = root.querySelector('.photo-gallery-title');
  const meta = root.querySelector('.photo-gallery-meta');
  const price = root.querySelector('.photo-gallery-price');
  const whatsapp = root.querySelector('.photo-gallery-whatsapp');
  const prev = root.querySelector('[data-gallery-prev]');
  const next = root.querySelector('[data-gallery-next]');

  image.src = photo.url;
  image.alt = `${property.title} — foto ${index + 1}`;
  counter.textContent = `${index + 1} / ${photos.length}`;
  title.textContent = property.title;
  meta.textContent = `${property.id} · ${property.neighborhood} · ${property.city}/MG · ${dealLabel(property.deal)}`;
  const condoParts = [];
  if (property.condoName) condoParts.push(property.condoName);
  if (property.condoFee) {
    condoParts.push(`Cond. R$ ${Number(property.condoFee).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  if (condoParts.length) {
    meta.textContent += ` · ${condoParts.join(' · ')}`;
  }
  price.textContent = formatPrice(property);
  whatsapp.href = whatsappLink(property);

  const multi = photos.length > 1;
  prev.hidden = !multi;
  next.hidden = !multi;
}

function openGallery(propertyId, startIndex = 0) {
  const property = PROPERTIES.find((item) => item.id === propertyId);
  if (!property) return;

  const photos = getPropertyPhotos(property);
  if (!photos.length) return;

  galleryState = {
    property,
    index: Math.max(0, Math.min(startIndex, photos.length - 1))
  };

  const root = ensureGallery();
  root.hidden = false;
  document.body.classList.add('gallery-open');
  renderGalleryFrame();
}

function closeGallery() {
  const root = document.querySelector('#photo-gallery');
  if (!root) return;
  root.hidden = true;
  document.body.classList.remove('gallery-open');
  galleryState = { property: null, index: 0 };
}

function stepGallery(delta) {
  const { property } = galleryState;
  if (!property) return;
  const photos = getPropertyPhotos(property);
  if (photos.length < 2) return;
  galleryState.index = (galleryState.index + delta + photos.length) % photos.length;
  renderGalleryFrame();
}

function setupGalleryTriggers() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-gallery]');
    if (!trigger) return;
    event.preventDefault();
    openGallery(trigger.getAttribute('data-open-gallery'), 0);
  });
}

function getParams() {
  return new URLSearchParams(window.location.search);
}

function filterProperties(source, params) {
  let list = [...source];
  const deal = params.get('deal');
  const type = params.get('tipo');
  const where = (params.get('onde') || '').trim().toLowerCase();
  const min = Number(params.get('min') || 0);
  const max = Number(params.get('max') || 0);
  const beds = Number(params.get('quartos') || 0);
  const sort = params.get('ordem') || 'recentes';

  if (deal === 'venda' || deal === 'aluguel') {
    list = list.filter((item) => item.deal === deal);
  }
  if (type && type !== 'Todos') {
    list = list.filter((item) => item.type.toLowerCase() === type.toLowerCase());
  }
  if (where) {
    list = list.filter((item) =>
      `${item.neighborhood} ${item.city} ${item.title} ${item.type}`.toLowerCase().includes(where)
    );
  }
  if (min) list = list.filter((item) => item.price >= min);
  if (max) list = list.filter((item) => item.price <= max);
  if (beds) list = list.filter((item) => item.bedrooms >= beds);

  if (sort === 'menor') list.sort((a, b) => a.price - b.price);
  if (sort === 'maior') list.sort((a, b) => b.price - a.price);
  if (sort === 'recentes') list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return list;
}

function renderFeatured() {
  const grid = document.querySelector('[data-featured-grid]');
  if (!grid) return;
  const featured = PROPERTIES.filter((item) => item.featured).slice(0, 3);
  const fallback = featured.length ? featured : PROPERTIES.slice(0, 3);
  grid.innerHTML = fallback.map(cardHtml).join('');
}

function renderListing() {
  const grid = document.querySelector('[data-listing-grid]');
  if (!grid) return;

  const params = getParams();
  const results = filterProperties(PROPERTIES, params);
  const meta = document.querySelector('[data-results-meta]');
  const title = document.querySelector('[data-listing-title]');
  const empty = document.querySelector('[data-empty-state]');

  if (title) {
    const dealParam = params.get('deal');
    const dealText = dealParam === 'aluguel' ? 'para alugar' : dealParam === 'venda' ? 'à venda' : '';
    const type = params.get('tipo');
    const where = params.get('onde');
    const plurals = {
      Casa: 'Casas',
      Apartamento: 'Apartamentos',
      Terreno: 'Terrenos',
      Chácara: 'Chácaras',
      Rural: 'Imóveis rurais',
      Comercial: 'Imóveis comerciais'
    };
    const parts = [];
    if (type && type !== 'Todos') parts.push(plurals[type] || type);
    else parts.push('Imóveis');
    if (dealText) parts.push(dealText);
    if (where) parts.push(`em ${where}`);
    else parts.push('em Tiros/MG e região');
    title.textContent = parts.join(' ');
  }

  if (meta) {
    meta.innerHTML = `<strong>${results.length}</strong> ${results.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`;
  }

  if (!results.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  grid.innerHTML = results.map(cardHtml).join('');
}

function syncListingControls() {
  const params = getParams();
  const deal = params.get('deal') || '';
  const type = params.get('tipo') || 'Todos';
  const where = params.get('onde') || '';
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const beds = params.get('quartos') || '';
  const sort = params.get('ordem') || 'recentes';

  document.querySelectorAll('[data-deal-chip]').forEach((chip) => {
    chip.classList.toggle('active', Boolean(deal) && chip.dataset.dealChip === deal);
  });
  document.querySelectorAll('[data-type-chip]').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.typeChip === type);
  });
  document.querySelectorAll('[data-beds-chip]').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.bedsChip === String(beds || '0'));
  });

  const whereInput = document.querySelector('[name="onde"]');
  const minInput = document.querySelector('[name="min"]');
  const maxInput = document.querySelector('[name="max"]');
  const sortSelect = document.querySelector('[name="ordem"]');
  if (whereInput) whereInput.value = where;
  if (minInput) minInput.value = min;
  if (maxInput) maxInput.value = max;
  if (sortSelect) sortSelect.value = sort;

  const count = document.querySelector('[data-filter-count]');
  if (count) {
    let active = 0;
    if (deal) active += 1;
    if (type && type !== 'Todos') active += 1;
    if (where) active += 1;
    if (min || max) active += 1;
    if (beds) active += 1;
    count.textContent = String(active);
  }
}

function updateParams(next) {
  const url = new URL(window.location.href);
  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === '0' || value === 'Todos') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  window.history.replaceState({}, '', url);
  syncListingControls();
  renderListing();
}

function setupHomeSearch() {
  const form = document.querySelector('#property-search');
  if (!form) return;

  const modeButtons = form.querySelectorAll('.deal button');
  let deal = 'venda';

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      modeButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      deal = button.dataset.deal || 'venda';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const type = form.querySelector('[name="tipo"]').value;
    const where = form.querySelector('[name="onde"]').value.trim();
    const params = new URLSearchParams();
    params.set('deal', deal);
    if (type && type !== 'Todos os imóveis') params.set('tipo', type);
    if (where) params.set('onde', where);
    window.location.href = `imoveis.html?${params.toString()}`;
  });
}

function setupListingPage() {
  if (!document.querySelector('[data-listing-grid]')) return;

  syncListingControls();
  renderListing();

  document.querySelectorAll('[data-deal-chip]').forEach((chip) => {
    chip.addEventListener('click', () => updateParams({ deal: chip.dataset.dealChip }));
  });
  document.querySelectorAll('[data-type-chip]').forEach((chip) => {
    chip.addEventListener('click', () => updateParams({ tipo: chip.dataset.typeChip }));
  });
  document.querySelectorAll('[data-beds-chip]').forEach((chip) => {
    chip.addEventListener('click', () => updateParams({ quartos: chip.dataset.bedsChip }));
  });

  const sortSelect = document.querySelector('[name="ordem"]');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => updateParams({ ordem: sortSelect.value }));
  }

  const applyBtn = document.querySelector('[data-apply-filters]');
  const clearBtn = document.querySelector('[data-clear-filters]');
  const panel = document.querySelector('[data-filter-panel]');
  const toggleBtn = document.querySelector('[data-toggle-filters]');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      updateParams({
        onde: document.querySelector('[name="onde"]')?.value.trim() || '',
        min: document.querySelector('[name="min"]')?.value || '',
        max: document.querySelector('[name="max"]')?.value || ''
      });
      if (panel && window.matchMedia('(max-width: 1100px)').matches) {
        panel.hidden = true;
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url);
      syncListingControls();
      renderListing();
    });
  }

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
    });
    if (window.matchMedia('(max-width: 1100px)').matches) {
      panel.hidden = true;
    }
  }
}

function setupChrome() {
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? '✕' : '☰';
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuBtn.textContent = '☰';
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

async function boot() {
  setupChrome();
  setupHomeSearch();
  setupGalleryTriggers();
  ensureGallery();

  try {
    PROPERTIES = await OtonStore.listPublicProperties();
  } catch (error) {
    console.error('Falha ao carregar imóveis do armazenamento local:', error);
    PROPERTIES = [];
  }

  renderFeatured();
  setupListingPage();
}

document.addEventListener('DOMContentLoaded', boot);
