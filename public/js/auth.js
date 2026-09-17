const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const body = Object.fromEntries(formData.entries());
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      document.getElementById('error').textContent = data.error;
      return;
    }
    window.location.href = '/dashboard';
  });
}

const modeSelect = document.getElementById('mode-select');
if (modeSelect) {
  modeSelect.addEventListener('change', () => {
    document.getElementById('institution-field').style.display =
      modeSelect.value === 'institutional' ? 'block' : 'none';
  });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const body = Object.fromEntries(formData.entries());
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      document.getElementById('error').textContent = data.error;
      return;
    }
    window.location.href = '/dashboard';
  });
}
