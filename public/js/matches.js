let me = null;

async function loadMatches() {
  me = await initNav();
  requireAuthRedirect(me);
  if (!me) return;

  const res = await fetch('/api/matches/mine');
  const data = await res.json();

  document.getElementById('matches-list').innerHTML = data.matches.map((m) => {
    const myParticipant = m.participants.find((p) => p.user_id === me.id);
    const others = m.participants.filter((p) => p.user_id !== me.id);
    const canAccept = myParticipant && !myParticipant.accepted && m.status === 'pending';

    return `
      <div class="card" style="margin-bottom:16px">
        <span class="badge ${m.type}">${m.type}</span>
        <span class="badge ${m.status}">${m.status}</span>
        <h3>${m.type === 'direct' ? `Swap with ${others[0].name}` : `Chain match (${m.participants.length} people)`}</h3>
        <p>You teach: <strong>${myParticipant.teaches_skill}</strong> — You receive: <strong>${myParticipant.receives_skill}</strong></p>
        ${m.type === 'chain' ? `<p class="muted">Loop: ${m.participants.map((p) => p.name).join(' → ')} → ${m.participants[0].name}</p>` : ''}
        <div class="row">
          ${canAccept ? `<button class="btn small" onclick="acceptMatch(${m.id})">Accept</button>` : ''}
          ${canAccept ? `<button class="btn secondary small" onclick="declineMatch(${m.id})">Decline</button>` : ''}
          ${m.status === 'accepted' ? `<button class="btn small" onclick="openSchedule(${m.id})">Schedule session</button>` : ''}
        </div>
      </div>
    `;
  }).join('') || '<p class="muted">No matches yet. Head to the Marketplace to propose one.</p>';
}

async function acceptMatch(id) {
  await fetch(`/api/matches/${id}/accept`, { method: 'POST' });
  loadMatches();
}

async function declineMatch(id) {
  await fetch(`/api/matches/${id}/decline`, { method: 'POST' });
  loadMatches();
}

function openSchedule(matchId) {
  document.getElementById('schedule-match-id').value = matchId;
  document.getElementById('schedule-modal').style.display = 'flex';
}

document.getElementById('cancel-schedule').addEventListener('click', () => {
  document.getElementById('schedule-modal').style.display = 'none';
});

document.getElementById('schedule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const matchId = document.getElementById('schedule-match-id').value;
  const scheduledAt = document.getElementById('scheduled-at').value;
  const provider = document.getElementById('provider').value;
  const price = parseFloat(document.getElementById('price').value) || 0;

  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, scheduledAt, provider, price })
  });
  if (res.ok) {
    document.getElementById('schedule-modal').style.display = 'none';
    window.location.href = '/sessions';
  }
});

loadMatches();
