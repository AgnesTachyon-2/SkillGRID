let me = null;
let selectedTarget = null;

function escapeHTML(value) {
  const element = document.createElement('div');
  element.textContent = value == null ? '' : String(value);
  return element.innerHTML;
}

async function loadMarketplace() {
  me = await initNav();
  requireAuthRedirect(me);
  if (!me) return;
  await search();
}

async function search() {
  const skill = document.getElementById('skill-input').value;
  const mode = document.getElementById('mode-filter').value;
  const params = new URLSearchParams();
  if (skill) params.set('skill', skill);
  if (mode) params.set('mode', mode);
  const res = await fetch(`/api/marketplace?${params.toString()}`);
  const data = await res.json();
  const results = data.results.filter((u) => u.id !== me.id);

  document.getElementById('results').innerHTML = results.map((u) => `
    <div class="card">
      <h3>${escapeHTML(u.name)} ${u.verified ? 'Verified' : ''}</h3>
      <span class="badge ${u.mode}">${u.mode}</span>
      <p class="muted">${escapeHTML(u.institution)}</p>
      <p><strong>Teaches:</strong> ${u.offered.map((s) => `<span class="skill-tag">${escapeHTML(s.skill_name)}${s.hourly_rate ? ` (${escapeHTML(s.hourly_rate)}/hr)` : ''}</span>`).join('') || '<span class="muted">none listed</span>'}</p>
      <button class="btn small" data-target="${encodeURIComponent(JSON.stringify(u)).replace(/'/g, '%27')}">Propose swap</button>
    </div>
  `).join('') || '<p class="muted">No matches found. Try a different search.</p>';
  document.querySelectorAll('[data-target]').forEach((button) => {
    button.addEventListener('click', () => openProposeModal(JSON.parse(decodeURIComponent(button.dataset.target))));
  });
}

document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  search();
});

document.getElementById('chain-search-btn').addEventListener('click', async () => {
  const res = await fetch('/api/matches/chain-search', { method: 'POST' });
  const data = await res.json();
  document.getElementById('chain-result').textContent =
    `Found ${data.chainsFound} chain match(es). Check the Matches page.`;
});

function openProposeModal(targetUser) {
  selectedTarget = targetUser;
  document.getElementById('target-user-id').value = targetUser.id;
  document.getElementById('my-teach-skill').innerHTML = me.offered.map((s) => `<option value="${s.skill_name}">${s.skill_name}</option>`).join('') || '<option value="">No skills listed — add one on your dashboard</option>';
  document.getElementById('their-teach-skill').innerHTML = targetUser.offered.map((s) => `<option value="${s.skill_name}">${s.skill_name}</option>`).join('');
  document.getElementById('propose-modal').style.display = 'flex';
}

document.getElementById('cancel-propose').addEventListener('click', () => {
  document.getElementById('propose-modal').style.display = 'none';
});

document.getElementById('propose-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const targetUserId = document.getElementById('target-user-id').value;
  const myTeachSkill = document.getElementById('my-teach-skill').value;
  const theirTeachSkill = document.getElementById('their-teach-skill').value;

  const res = await fetch('/api/matches/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId, myTeachSkill, theirTeachSkill })
  });
  const data = await res.json();
  if (!res.ok) {
    document.getElementById('propose-error').textContent = data.error;
    return;
  }
  document.getElementById('propose-modal').style.display = 'none';
  window.location.href = '/matches';
});

loadMarketplace();
