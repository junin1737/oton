(() => {
  const form = document.querySelector('#login-form');
  const errorEl = document.querySelector('#login-error');
  const params = new URLSearchParams(location.search);
  const next = params.get('next');

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
