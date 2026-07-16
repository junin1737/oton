(() => {
  const form = document.querySelector('#login-form');
  const errorEl = document.querySelector('#login-error');
  const params = new URLSearchParams(location.search);
  const next = params.get('next');

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
        const links = items
          .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
          .join('');
        const login = includeLogin ? '<a href="login.html">Entrar</a>' : '';
        nav.innerHTML = `${links}${login}`;
      });
    } catch (error) {
      console.error('Falha ao carregar menu:', error);
    }
  }

  renderSiteNavigation();

  const existing = OtonStore.getSession();
  if (existing) {
    if (existing.role !== 'admin') {
      OtonStore.logout();
    } else {
      location.replace(next || OtonStore.roleHome('admin'));
      return;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    const email = form.email.value.trim();
    const password = form.password.value;
    const submit = form.querySelector('.auth-submit');
    submit.disabled = true;
    submit.textContent = 'Entrando...';

    try {
      const result = await OtonStore.login(email, password);
      if (!result.ok) {
        errorEl.textContent = result.error || 'E-mail ou senha inválidos.';
        errorEl.hidden = false;
        return;
      }

      const safeNext = next && !next.includes('://') && !next.startsWith('//') ? next : null;
      window.location.assign(safeNext || result.home);
    } catch (error) {
      console.error(error);
      errorEl.textContent = error?.message || 'Não foi possível entrar. Tente novamente.';
      errorEl.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Entrar';
    }
  });
})();
