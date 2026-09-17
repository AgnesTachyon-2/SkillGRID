const db = require('../config/db');
const Session = require('../models/Session');
const Match = require('../models/Match');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateMeetingLink } = require('../utils/meetingLink');

function getConfigValue(key, fallback) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? parseFloat(row.value) : fallback;
}

exports.schedule = (req, res) => {
  const { matchId, scheduledAt, provider, price } = req.body;
  const match = Match.findById(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (!match.participants.some((participant) => participant.user_id === req.session.userId)) {
    return res.status(403).json({ error: 'Only match participants can schedule a session' });
  }
  if (match.status !== 'accepted') {
    return res.status(400).json({ error: 'Match must be accepted by all parties before scheduling' });
  }
  const scheduledDate = new Date(scheduledAt);
  const numericPrice = Number(price || 0);
  if (!scheduledAt || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return res.status(400).json({ error: 'scheduledAt must be a valid future date' });
  }
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }
  const meetingLink = generateMeetingLink(provider);
  const session = Session.create({ matchId, scheduledAt: scheduledDate.toISOString(), meetingLink, price: numericPrice });
  res.json({ session });
};

exports.mine = (req, res) => {
  const sessions = Session.forUser(req.session.userId);
  res.json({ sessions });
};

// Completing a session settles the ledger:
// - Direct/chain "teach for tokens" swaps (institutional mode): each teacher earns tokens.
// - Public P2P paid sessions: handled via payments.checkout instead; completing just marks status.
exports.complete = (req, res) => {
  const session = Session.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!Session.hasParticipant(session.id, req.session.userId)) {
    return res.status(403).json({ error: 'Only session participants can complete a session' });
  }
  if (session.status !== 'scheduled') {
    return res.status(400).json({ error: 'Only scheduled sessions can be completed' });
  }

  const statusUpdate = Session.setStatus(session.id, 'completed');
  if (statusUpdate.changes !== 1) {
    return res.status(409).json({ error: 'Session was already finalized' });
  }

  const tokenValuation = getConfigValue('token_valuation', 1);
  for (const participant of session.match.participants) {
    const teacher = User.findById(participant.user_id);
    if (teacher.mode === 'institutional') {
      const tokensEarned = tokenValuation;
      User.adjustBalance(teacher.id, 'token', tokensEarned);
      Transaction.record({
        userId: teacher.id,
        ledger: 'token',
        amount: tokensEarned,
        description: `Earned for teaching "${participant.teaches_skill}"`,
        sessionId: session.id
      });
    }
  }

  res.json({ session: Session.findById(session.id) });
};

exports.markNoShow = (req, res) => {
  const userId = Number(req.body.userId);
  const session = Session.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (!Session.hasParticipant(session.id, req.session.userId)) {
    return res.status(403).json({ error: 'Only session participants can report a no-show' });
  }
  if (!Number.isInteger(userId) || !Session.hasParticipant(session.id, userId) || userId === req.session.userId) {
    return res.status(400).json({ error: 'userId must identify another session participant' });
  }
  if (session.status !== 'scheduled') {
    return res.status(400).json({ error: 'Only scheduled sessions can be marked no-show' });
  }
  const statusUpdate = Session.setStatus(session.id, 'no_show');
  if (statusUpdate.changes !== 1) {
    return res.status(409).json({ error: 'Session was already finalized' });
  }
  Session.recordNoShow(session.id, userId);
  User.incrementNoShow(userId);
  res.json({ session: Session.findById(session.id) });
};
