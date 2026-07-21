const WHATSAPP = '5534998336147';

let PROPERTIES = [];

function formatPrice(property) {
  if (!property.price) return 'Consulte o valor';
  const value = property.price.toLocaleString('pt-BR');
  if (property.deal === 'aluguel') return `R$ ${value}/mês`;
  if (property.deal === 'ambos') return `R$ ${value}`;
  return `R$ ${value}`;
}

function dealLabel(deal) {
  if (deal === 'aluguel') return 'Para alugar';
  if (deal === 'ambos') return 'Venda e aluguel';
  return 'À venda';
}

function matchesDeal(itemDeal, filterDeal) {
  if (!filterDeal) return true;
  if (filterDeal === 'venda') return itemDeal === 'venda' || itemDeal === 'ambos';
  if (filterDeal === 'aluguel') return itemDeal === 'aluguel' || itemDeal === 'ambos';
  if (filterDeal === 'ambos') return itemDeal === 'ambos';
  return itemDeal === filterDeal;
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
    <article class="card" data-id="${property.id}" data-open-gallery="${property.id}" role="button" tabindex="0" aria-label="Ver detalhes de ${property.title}">
      <div class="photo" style="background-image:url('${cover}')">
        <span>${dealLabel(property.deal)}</span>
        <span class="code">${property.id}</span>
        ${count > 1 ? `<span class="photo-count">${count} fotos</span>` : ''}
      </div>
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
          <p class="photo-gallery-description"></p>
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
  const description = root.querySelector('.photo-gallery-description');
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
  const desc = String(property.description || '').trim();
  if (description) {
    description.textContent = desc;
    description.hidden = !desc;
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
    if (event.target.closest('a.card-whatsapp')) return;
    const trigger = event.target.closest('[data-open-gallery]');
    if (!trigger) return;
    event.preventDefault();
    openGallery(trigger.getAttribute('data-open-gallery'), 0);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const trigger = event.target.closest('[data-open-gallery]');
    if (!trigger || event.target.closest('a')) return;
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

  if (deal === 'venda' || deal === 'aluguel' || deal === 'ambos') {
    list = list.filter((item) => matchesDeal(item.deal, deal));
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
    const dealText = dealParam === 'aluguel'
      ? 'para alugar'
      : dealParam === 'venda'
        ? 'à venda'
        : dealParam === 'ambos'
          ? 'para venda e aluguel'
          : '';
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
    const value = chip.dataset.dealChip || '';
    chip.classList.toggle('active', value === deal);
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
    chip.addEventListener('click', () => updateParams({ deal: chip.dataset.dealChip || '' }));
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
    mobileNav.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      mobileNav.classList.remove('open');
      menuBtn.textContent = '☰';
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderSiteNavigation() {
  const targets = document.querySelectorAll('[data-site-nav]');
  if (!targets.length) return;

  try {
    const items = await OtonStore.getNavigation();
    targets.forEach((nav) => {
      const includeLogin = nav.dataset.includeLogin !== 'false';
      const includeCta = nav.dataset.includeCta === 'true';
      const links = items
        .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
        .join('');
      const login = includeLogin ? '<a href="login.html">Entrar</a>' : '';
      const cta = includeCta
        ? '<a class="header-cta" href="https://wa.me/5534998336147" target="_blank" rel="noopener">Fale conosco <b>↗</b></a>'
        : '';
      nav.innerHTML = `${links}${login}${cta}`;
    });
  } catch (error) {
    console.error('Falha ao carregar menu:', error);
  }
}

async function renderBiography() {
  const section = document.querySelector('[data-biography]');
  if (!section) return;

  try {
    const bio = await OtonStore.getBiography();
    const nameEl = section.querySelector('[data-bio-name]');
    const titleEl = section.querySelector('[data-bio-title]');
    const textEl = section.querySelector('[data-bio-text]');
    const photoEl = section.querySelector('[data-bio-photo]');

    if (nameEl) nameEl.textContent = bio.name;
    if (titleEl) titleEl.textContent = bio.title;
    if (textEl) textEl.textContent = bio.text;

    if (photoEl) {
      if (bio.photoUrl) {
        photoEl.style.backgroundImage = `url('${bio.photoUrl}')`;
        photoEl.classList.add('has-photo');
      } else {
        photoEl.style.backgroundImage = '';
        photoEl.classList.remove('has-photo');
      }
    }
  } catch (error) {
    console.error('Falha ao carregar biografia:', error);
  }
}

async function renderOfficeShowcase() {
  const section = document.querySelector('[data-office-showcase]');
  if (!section) return;

  try {
    const data = await OtonStore.getOfficeShowcase();
    const titleEl = section.querySelector('[data-office-title]');
    const textEl = section.querySelector('[data-office-text]');
    const slidesEl = section.querySelector('[data-office-slides]');
    const prevBtn = section.querySelector('[data-office-prev]');
    const nextBtn = section.querySelector('[data-office-next]');
    const counterEl = section.querySelector('[data-office-counter]');
    const mediaEl = section.querySelector('[data-office-media]');

    if (titleEl) titleEl.textContent = data.title;
    if (textEl) textEl.textContent = data.text;
    if (!slidesEl) return;

    const photos = (data.photos || []).filter((photo) => photo.url);
    if (section._officeTimer) {
      clearInterval(section._officeTimer);
      section._officeTimer = null;
    }

    if (!photos.length) {
      slidesEl.innerHTML = '';
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (counterEl) counterEl.hidden = true;
      return;
    }

    slidesEl.innerHTML = photos
      .map((photo, index) => `
        <div
          class="office-showcase-slide${index === 0 ? ' is-active' : ''}"
          style="background-image:url('${photo.url}')"
          role="img"
          aria-label="${escapeHtml(photo.name || `Foto ${index + 1} do escritório`)}"
          aria-hidden="${index === 0 ? 'false' : 'true'}">
        </div>
      `)
      .join('');

    let index = 0;
    const showNav = photos.length > 1;
    if (prevBtn) prevBtn.hidden = !showNav;
    if (nextBtn) nextBtn.hidden = !showNav;
    if (counterEl) {
      counterEl.hidden = !showNav;
      counterEl.textContent = `1 / ${photos.length}`;
    }

    const showSlide = (nextIndex) => {
      const slides = [...slidesEl.querySelectorAll('.office-showcase-slide')];
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (counterEl) counterEl.textContent = `${index + 1} / ${photos.length}`;
    };

    const restartTimer = () => {
      if (section._officeTimer) clearInterval(section._officeTimer);
      if (photos.length < 2) return;
      const ms = Math.max(2, Number(data.intervalSeconds) || 5) * 1000;
      section._officeTimer = setInterval(() => showSlide(index + 1), ms);
    };

    if (prevBtn) {
      prevBtn.onclick = () => {
        showSlide(index - 1);
        restartTimer();
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        showSlide(index + 1);
        restartTimer();
      };
    }

    if (mediaEl) {
      mediaEl.onmouseenter = () => {
        if (section._officeTimer) {
          clearInterval(section._officeTimer);
          section._officeTimer = null;
        }
      };
      mediaEl.onmouseleave = () => restartTimer();
    }

    restartTimer();
  } catch (error) {
    console.error('Falha ao carregar fotos do escritório:', error);
  }
}

async function renderSiteVisual() {
  try {
    const visual = await OtonStore.getSiteVisual();
    document.querySelectorAll('[data-site-logo]').forEach((img) => {
      img.src = visual.logoUrl || OtonStore.DEFAULT_LOGO_PATH;
    });

    const hero = document.querySelector('[data-hero]');
    const slidesEl = document.querySelector('[data-hero-slides]');
    if (!hero || !slidesEl) return;

    const banners = (visual.banners || []).filter((item) => item.url);
    if (hero._heroTimer) {
      clearInterval(hero._heroTimer);
      hero._heroTimer = null;
    }

    if (!banners.length) {
      slidesEl.innerHTML = '';
      return;
    }

    slidesEl.innerHTML = banners
      .map((banner, index) => `
        <div
          class="hero-slide${index === 0 ? ' is-active' : ''}"
          style="background-image:url('${banner.url}')"
          aria-hidden="${index === 0 ? 'false' : 'true'}">
        </div>
      `)
      .join('');

    let prevBtn = hero.querySelector('[data-hero-prev]');
    let nextBtn = hero.querySelector('[data-hero-next]');
    if (!prevBtn) {
      prevBtn = document.createElement('button');
      prevBtn.className = 'hero-nav prev';
      prevBtn.type = 'button';
      prevBtn.setAttribute('data-hero-prev', '');
      prevBtn.setAttribute('aria-label', 'Banner anterior');
      prevBtn.textContent = '‹';
      hero.appendChild(prevBtn);
    }
    if (!nextBtn) {
      nextBtn = document.createElement('button');
      nextBtn.className = 'hero-nav next';
      nextBtn.type = 'button';
      nextBtn.setAttribute('data-hero-next', '');
      nextBtn.setAttribute('aria-label', 'Próximo banner');
      nextBtn.textContent = '›';
      hero.appendChild(nextBtn);
    }

    const showNav = banners.length > 1;
    prevBtn.hidden = !showNav;
    nextBtn.hidden = !showNav;

    let index = 0;
    const showSlide = (nextIndex) => {
      const slides = [...slidesEl.querySelectorAll('.hero-slide')];
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    };

    const restartTimer = () => {
      if (hero._heroTimer) clearInterval(hero._heroTimer);
      if (banners.length < 2) return;
      const ms = Math.max(2, Number(visual.intervalSeconds) || 6) * 1000;
      hero._heroTimer = setInterval(() => showSlide(index + 1), ms);
    };

    prevBtn.onclick = () => {
      showSlide(index - 1);
      restartTimer();
    };
    nextBtn.onclick = () => {
      showSlide(index + 1);
      restartTimer();
    };

    restartTimer();
  } catch (error) {
    console.error('Falha ao carregar banner/logo:', error);
  }
}

async function renderSiteFooter() {
  const footers = document.querySelectorAll('[data-site-footer]');
  if (!footers.length) return;

  try {
    const data = await OtonStore.getFooter();
    footers.forEach((footer) => {
      const setText = (selector, value) => {
        const el = footer.querySelector(selector);
        if (el) el.textContent = value;
      };
      setText('[data-footer-brand-name]', data.brandName);
      setText('[data-footer-creci]', data.creci);
      setText('[data-footer-brand-text]', data.brandText);
      setText('[data-footer-properties-title]', data.propertiesTitle);
      setText('[data-footer-region-title]', data.regionTitle);
      setText('[data-footer-contact-title]', data.contactTitle);
      setText('[data-footer-copyright]', data.copyright);

      const logoEl = footer.querySelector('[data-footer-logo]');
      if (logoEl) {
        logoEl.src = data.logoUrl || data.logoDataUrl || OtonStore.DEFAULT_LOGO_PATH;
        logoEl.alt = data.brandName || 'Óton Rodrigo Imóveis';
      }

      const propLinks = footer.querySelector('[data-footer-properties-links]');
      if (propLinks) {
        propLinks.innerHTML = (data.propertiesLinks || [])
          .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
          .join('');
      }
      const regionLinks = footer.querySelector('[data-footer-region-links]');
      if (regionLinks) {
        regionLinks.innerHTML = (data.regionLinks || [])
          .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
          .join('');
      }
      const contactLinks = footer.querySelector('[data-footer-contact-links]');
      if (contactLinks) {
        contactLinks.innerHTML = `
          <a href="${escapeHtml(data.phoneHref)}">${escapeHtml(data.phoneLabel)}</a>
          <a href="${escapeHtml(data.whatsappHref)}" target="_blank" rel="noopener">${escapeHtml(data.whatsappLabel)}</a>
          <a href="${escapeHtml(data.loginHref)}">${escapeHtml(data.loginLabel)}</a>
          <a href="${escapeHtml(data.instagramHref)}" target="_blank" rel="noopener">${escapeHtml(data.instagramLabel)}</a>
        `;
      }
      const top = footer.querySelector('[data-footer-top]');
      if (top) {
        top.textContent = data.backToTopLabel;
        top.href = '#inicio';
      }
    });
  } catch (error) {
    console.error('Falha ao carregar rodapé:', error);
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
  await renderSiteNavigation();
  await renderSiteVisual();
  await renderSiteFooter();
  renderBiography();
  renderOfficeShowcase();
}

document.addEventListener('DOMContentLoaded', boot);
