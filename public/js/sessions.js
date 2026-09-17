let me = null;

function escapeHTML(value) {
  const element = document.createElement('div');
  element.textContent = value == null ? '' : String(value);
  return element.innerHTML;
}

async function loadSessions() {
  me = await initNav();
  requireAuthRedirect(me);
  if (!me) return;

  const res = await fetch('/api/sessions/mine');
  const data = await res.json();

  document.getElementById('sessions-list').innerHTML = data.sessions.map((s) => {
    const others = s.match.participants.filter((p) => p.user_id !== me.id);
    const isPublicPaid = s.price > 0;

    return `
      <div class="card" style="margin-bottom:16px">
        <span class="badge ${s.status}">${s.status}</span>
        <h3>${new Date(s.scheduled_at).toLocaleString()}</h3>
        <p>With: ${others.map((o) => escapeHTML(o.name)).join(', ')}</p>
        <p><a href="${escapeHTML(s.meeting_link)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.meeting_link)}</a></p>
        ${isPublicPaid ? `<p>Price: ₱${s.price.toFixed(2)} — ${s.paid ? 'Paid ✅' : 'Unpaid'}</p>` : ''}
        <div class="row">
          ${s.status === 'scheduled' && isPublicPaid && !s.paid ? `<button class="btn small" onclick="checkout(${s.id})">Pay (sandbox)</button>` : ''}
          ${s.status === 'scheduled' ? `<button class="btn small" onclick="completeSession(${s.id})">Mark complete</button>` : ''}
          ${s.status === 'scheduled' ? others.map((o) => `<button class="btn secondary small" onclick="noShow(${s.id}, ${o.user_id})">No-show: ${o.name}</button>`).join('') : ''}
          ${s.status === 'completed' ? others.map((o) => `<button class="btn secondary small" onclick="openReview(${s.id}, ${o.user_id})">Review ${o.name}</button>`).join('') : ''}
        </div>
      </div>
    `;
  }).join('') || '<p class="muted">No sessions scheduled yet. Accept a match first, then schedule one.</p>';
}

async function checkout(sessionId) {
  const res = await fetch('/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, method: 'GCASH' })
  });
  const data = await res.json();
  if (res.ok) alert(`Sandbox payment successful. Transaction: ${data.sandboxTransactionId}`);
  loadSessions();
}

async function completeSession(id) {
  await fetch(`/api/sessions/${id}/complete`, { method: 'POST' });
  loadSessions();
}

async function noShow(sessionId, userId) {
  await fetch(`/api/sessions/${sessionId}/no-show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  loadSessions();
}

function openReview(sessionId, revieweeId) {
  document.getElementById('review-session-id').value = sessionId;
  document.getElementById('review-reviewee-id').value = revieweeId;
  document.getElementById('review-modal').style.display = 'flex';
}

document.getElementById('cancel-review').addEventListener('click', () => {
  document.getElementById('review-modal').style.display = 'none';
});

document.getElementById('review-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sessionId = document.getElementById('review-session-id').value;
  const revieweeId = document.getElementById('review-reviewee-id').value;
  const rating = parseInt(document.getElementById('review-rating').value, 10);
  const comment = document.getElementById('review-comment').value;

  await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, revieweeId, rating, comment })
  });
  document.getElementById('review-modal').style.display = 'none';
  loadSessions();
});

loadSessions();
