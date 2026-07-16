(() => {
  const form = document.querySelector('#login-form');
  const errorEl = document.querySelector('#login-error');
  const tabs = document.querySelectorAll('.role-tab');
  const demos = {
    admin: { email: 'admin@oton.imoveis', password: 'oton2026' },
    proprietario: { email: 'proprietario@oton.imoveis', password: 'prop2026' },
    inquilino: { email: 'inquilino@oton.imoveis', password: 'inq2026' }
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
    if (demo && !form.email.value) {
      form.email.value = demo.email;
      form.password.value = demo.password;
    } else if (demo) {
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
      await OtonStore.ensureUsersSeeded();
      const result = await OtonStore.login(email, password);
      if (!result.ok) {
        errorEl.textContent = result.error;
        errorEl.hidden = false;
        return;
      }

      const hint = form.roleHint.value;
      if (hint && result.user.role !== hint) {
        // Still allow login, but go to the real role home.
      }

      const safeNext = next && !next.includes('://') ? next : null;
      location.href = safeNext || result.home;
    } catch (error) {
      console.error(error);
      errorEl.textContent = 'Não foi possível entrar. Tente novamente.';
      errorEl.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Entrar na área';
    }
  });
})();
