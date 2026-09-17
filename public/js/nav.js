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

function renderSiteChrome() {
  if (!document.querySelector('.site-footer')) {
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="site-footer">
        <span>SkillGRID</span>
        <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refunds">Refunds</a><a href="/cookies">Cookies</a></nav>
      </footer>
    `);
  }
  if (localStorage.getItem('skillgrid-cookie-consent')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="cookie-banner" role="dialog" aria-label="Cookie notice" aria-live="polite">
      <div><strong>Cookie notice</strong><p>SkillGRID uses essential cookies for sign-in sessions and remembers this choice. See our <a href="/cookies">Cookie Policy</a>.</p></div>
      <button class="btn small" type="button" id="accept-cookies">Accept</button>
    </aside>
  `);
  document.getElementById('accept-cookies').addEventListener('click', () => {
    localStorage.setItem('skillgrid-cookie-consent', 'accepted');
    document.querySelector('.cookie-banner').remove();
  });
}

async function initNav() {
  const user = await fetchMe();
  renderNav(user);
  renderSiteChrome();
  return user;
}

function requireAuthRedirect(user) {
  if (!user) window.location.href = '/login';
}
