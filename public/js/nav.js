async function fetchMe() {
  const res = await fetch('/api/auth/me');
  const data = await res.json();
  return data.user;
}

function renderNav(user) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  if (user) {
    nav.innerHTML = `
      <a href="/marketplace">Marketplace</a>
      <a href="/matches">Matches</a>
      <a href="/sessions">Sessions</a>
      <a href="/dashboard">Dashboard</a>
      ${user.is_admin ? '<a href="/admin">Admin</a>' : ''}
      <a href="#" id="logout-link">Logout (${user.name})</a>
    `;
    document.getElementById('logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    });
  } else {
    nav.innerHTML = `
      <a href="/login">Login</a>
      <a href="/register">Register</a>
    `;
  }
}

async function initNav() {
  const user = await fetchMe();
  renderNav(user);
  return user;
}

function requireAuthRedirect(user) {
  if (!user) window.location.href = '/login';
}
