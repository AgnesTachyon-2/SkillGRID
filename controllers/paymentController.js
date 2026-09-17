require('dotenv').config();
const db = require('../config/db');
const Session = require('../models/Session');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

function getConfigValue(key, fallback) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? parseFloat(row.value) : fallback;
}

// Simulates a GCash/PayMaya-style sandbox checkout for Public P2P Mode bookings.
// Out-of-scope note from the proposal: no live/real transactions occur here —
// this always runs against a sandbox flag and never touches a real gateway.
exports.checkout = (req, res) => {
  const sandboxMode = process.env.PAYMENT_SANDBOX_MODE !== 'false';
  if (!sandboxMode) {
    return res.status(400).json({ error: 'Live payments are out of scope for this capstone build' });
  }

  const { sessionId, method } = req.body;
  const session = Session.findById(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!Session.hasParticipant(session.id, req.session.userId)) {
    return res.status(403).json({ error: 'Only session participants can pay for a session' });
  }
  if (session.status !== 'scheduled' || session.price <= 0) {
    return res.status(400).json({ error: 'Only scheduled paid sessions can be checked out' });
  }
  if (session.paid) return res.status(400).json({ error: 'Session already paid' });
  if (method && !['GCASH', 'PAYMAYA'].includes(String(method).toUpperCase())) {
    return res.status(400).json({ error: 'Unsupported payment method' });
  }

  const commissionPct = getConfigValue('platform_commission_pct', 10);
  if (!Number.isFinite(commissionPct) || commissionPct < 0 || commissionPct > 100) {
    return res.status(500).json({ error: 'Invalid platform commission configuration' });
  }
  const price = Number(session.price);
  const commission = Math.round(price * (commissionPct / 100) * 100) / 100;
  const payoutTotal = price - commission;

  // Simulated sandbox gateway response
  const sandboxTransactionId = `SANDBOX-${method || 'GCASH'}-${Date.now()}`;

  const teacherParticipants = session.match.participants;
  const payoutPerTeacher = teacherParticipants.length ? payoutTotal / teacherParticipants.length : 0;

  const settle = db.transaction(() => {
    const paid = Session.markPaid(session.id);
    if (paid.changes !== 1) return false;
    for (const participant of teacherParticipants) {
      User.adjustBalance(participant.user_id, 'fiat', payoutPerTeacher);
      Transaction.record({
        userId: participant.user_id,
        ledger: 'fiat',
        amount: payoutPerTeacher,
        description: `Payout for session #${session.id} (after ${commissionPct}% platform commission)`,
        sessionId: session.id
      });
    }
    return true;
  });
  if (!settle()) return res.status(409).json({ error: 'Session payment was already processed' });

  res.json({
    success: true,
    sandbox: true,
    sandboxTransactionId,
    priceCharged: price,
    platformCommission: commission,
    payoutPerTeacher
  });
};
