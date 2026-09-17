const db = require('../config/db');

const Session = {
  create({ matchId, scheduledAt, meetingLink, price }) {
    const info = db.prepare(`
      INSERT INTO sessions (match_id, scheduled_at, meeting_link, price)
      VALUES (?, ?, ?, ?)
    `).run(matchId, scheduledAt, meetingLink, price || 0);
    return Session.findById(info.lastInsertRowid);
  },

  findById(id) {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    if (!session) return null;
    session.match = require('./Match').findById(session.match_id);
    return session;
  },

  forUser(userId) {
    const matchIds = db.prepare('SELECT DISTINCT match_id FROM match_participants WHERE user_id = ?').all(userId).map((r) => r.match_id);
    if (!matchIds.length) return [];
    const placeholders = matchIds.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * FROM sessions WHERE match_id IN (${placeholders}) ORDER BY scheduled_at DESC`).all(...matchIds);
    return rows.map((r) => Session.findById(r.id));
  },

  hasParticipant(id, userId) {
    return Boolean(db.prepare(`
      SELECT 1 FROM match_participants
      WHERE match_id = (SELECT match_id FROM sessions WHERE id = ?)
        AND user_id = ?
    `).get(id, userId));
  },

  markPaid(id) {
    return db.prepare('UPDATE sessions SET paid = 1 WHERE id = ? AND paid = 0').run(id);
  },

  setStatus(id, status) {
    return db.prepare('UPDATE sessions SET status = ? WHERE id = ? AND status = \'scheduled\'').run(status, id);
  },

  recordNoShow(sessionId, userId) {
    db.prepare('INSERT INTO session_no_shows (session_id, user_id) VALUES (?, ?)').run(sessionId, userId);
  }
};

module.exports = Session;
