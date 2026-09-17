function escapeHTML(value) {
  const element = document.createElement('div');
  element.textContent = value == null ? '' : String(value);
  return element.innerHTML;
}

async function loadAdmin() {
  const user = await initNav();
  requireAuthRedirect(user);
  if (!user) return;
  if (!user.is_admin) {
    document.querySelector('main').innerHTML = '<p class="error-msg">Admin access required.</p>';
    return;
  }

  const [analyticsRes, configRes, reportsRes] = await Promise.all([
    fetch('/api/admin/analytics'),
    fetch('/api/admin/config'),
    fetch('/api/admin/reports')
  ]);
  const analytics = await analyticsRes.json();
  const config = (await configRes.json()).config;
  const reports = (await reportsRes.json()).reports;

  document.getElementById('analytics-grid').innerHTML = `
    <div class="card"><h3>${analytics.userCount}</h3><p class="muted">Total users (${analytics.institutionalCount} institutional / ${analytics.publicCount} public)</p></div>
    <div class="card"><h3>${analytics.matchCount}</h3><p class="muted">Total matches (${analytics.chainMatchCount} chain)</p></div>
    <div class="card"><h3>${analytics.completedSessions}</h3><p class="muted">Completed sessions</p></div>
    <div class="card"><h3>${analytics.noShowCount}</h3><p class="muted">No-shows</p></div>
    <div class="card"><h3>${analytics.openReports}</h3><p class="muted">Open reports</p></div>
    <div class="card"><h3>₱${analytics.estimatedPlatformFeesEarned}</h3><p class="muted">Estimated platform fees earned</p></div>
  `;

  document.getElementById('token-valuation').value = config.token_valuation;
  document.getElementById('commission-pct').value = config.platform_commission_pct;

  document.querySelector('#reports-table tbody').innerHTML = reports.map((r) => `
    <tr>
      <td>${escapeHTML(r.reporter_name)}</td>
      <td>${escapeHTML(r.reported_name)}</td>
      <td>${escapeHTML(r.reason)}</td>
      <td><span class="badge ${r.status === 'open' ? 'pending' : 'completed'}">${r.status}</span></td>
      <td>${r.status === 'open' ? `<button class="btn small" onclick="resolveReport(${r.id}, 'resolved')">Resolve</button> <button class="btn secondary small" onclick="resolveReport(${r.id}, 'dismissed')">Dismiss</button>` : ''}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="muted">No reports.</td></tr>';
}

async function resolveReport(id, status) {
  await fetch(`/api/admin/reports/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadAdmin();
}

document.getElementById('config-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tokenValuation = document.getElementById('token-valuation').value;
  const commissionPct = document.getElementById('commission-pct').value;

  await fetch('/api/admin/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'token_valuation', value: tokenValuation })
  });
  await fetch('/api/admin/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'platform_commission_pct', value: commissionPct })
  });
  loadAdmin();
});

loadAdmin();
