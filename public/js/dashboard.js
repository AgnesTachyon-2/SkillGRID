let currentUser = null;

function escapeHTML(value) {
  const element = document.createElement('div');
  element.textContent = value == null ? '' : String(value);
  return element.innerHTML;
}

function parseOfferedInput(str) {
  return str.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const [skill_name, rate] = s.split(':').map((p) => p.trim());
    return { skill_name, hourly_rate: rate ? parseFloat(rate) : 0 };
  });
}

function parseWantedInput(str) {
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

async function loadDashboard() {
  const user = await initNav();
  requireAuthRedirect(user);
  if (!user) return;

  const res = await fetch('/api/users/me');
  const data = await res.json();
  currentUser = data.user;

  document.getElementById('welcome').textContent = `Welcome, ${currentUser.name}`;
  document.getElementById('mode-badge').textContent = currentUser.mode;
  document.getElementById('mode-badge').className = `badge ${currentUser.mode}`;
  document.getElementById('verified-badge').textContent = currentUser.verified ? 'Verified' : 'Unverified';
  document.getElementById('token-balance').textContent = currentUser.token_balance.toFixed(2);
  document.getElementById('fiat-balance').textContent = `₱${currentUser.fiat_balance.toFixed(2)}`;
  document.getElementById('avg-rating').textContent = currentUser.averageRating ? `${currentUser.averageRating} / 5` : '—';

  document.getElementById('name-input').value = currentUser.name;
  document.getElementById('mode-input').value = currentUser.mode;
  document.getElementById('institution-input').value = currentUser.institution || '';
  document.getElementById('offered-input').value = currentUser.offered.map((s) => s.hourly_rate ? `${s.skill_name}:${s.hourly_rate}` : s.skill_name).join(', ');
  document.getElementById('wanted-input').value = currentUser.wanted.map((s) => s.skill_name).join(', ');

  const txRes = await fetch('/api/users/me/transactions');
  const txData = await txRes.json();
  const tbody = document.querySelector('#tx-table tbody');
  tbody.innerHTML = txData.transactions.map((t) => `
    <tr>
      <td>${new Date(t.created_at).toLocaleString()}</td>
      <td>${t.ledger}</td>
      <td>${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}</td>
      <td>${escapeHTML(t.description)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="muted">No transactions yet.</td></tr>';
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name-input').value;
  const mode = document.getElementById('mode-input').value;
  const institution = document.getElementById('institution-input').value;
  const offered = parseOfferedInput(document.getElementById('offered-input').value);
  const wanted = parseWantedInput(document.getElementById('wanted-input').value);

  const res = await fetch('/api/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mode, institution, offered, wanted })
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById('save-msg').textContent = 'Profile saved.';
    loadDashboard();
  }
});

loadDashboard();
