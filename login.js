(() => {
  const form = document.querySelector('#login-form');
  const errorEl = document.querySelector('#login-error');
  const tabs = document.querySelectorAll('.role-tab');
  const demos = {
    admin: { email: 'admin@oton.com.br', password: 'oton2026' },
    proprietario: { email: 'proprietario@oton.com.br', password: 'prop2026' },
    inquilino: { email: 'inquilino@oton.com.br', password: 'inq2026' }
  };

  const params = new URLSearchParams(location.search);
  const next = params.get('next');

  const existing = OtonStore.getSession();
  if (existing) {
    location.replace(next || OtonStore.roleHome(existing.role));
    return;
  }

  function setRole(role) {
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.role === role));
    form.roleHint.value = role;
    const demo = demos[role];
    if (demo) {
      form.email.value = demo.email;
      form.password.value = demo.password;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setRole(tab.dataset.role));
  });

  setRole('admin');

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
      submit.textContent = 'Entrar na área';
    }
  });
})();
