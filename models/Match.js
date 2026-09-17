const db = require('../config/db');

const Match = {
  createDirect({ userAId, userBId, aTeaches, bTeaches }) {
    const tx = db.transaction(() => {
      const info = db.prepare(`INSERT INTO matches (type, status) VALUES ('direct', 'pending')`).run();
      const matchId = info.lastInsertRowid;
      db.prepare(`
        INSERT INTO match_participants (match_id, user_id, teaches_skill, receives_skill, accepted)
        VALUES (?, ?, ?, ?, 1)
      `).run(matchId, userAId, aTeaches, bTeaches);
      db.prepare(`
        INSERT INTO match_participants (match_id, user_id, teaches_skill, receives_skill, accepted)
        VALUES (?, ?, ?, ?, 0)
      `).run(matchId, userBId, bTeaches, aTeaches);
      return matchId;
    });
    const matchId = tx();
    return Match.findById(matchId);
  },

  createChain(chainGroupId, edges) {
    // edges: [{ fromUserId, toUserId, skillFromToTo }], where toUser teaches fromUser.
    const tx = db.transaction(() => {
      const info = db.prepare(`INSERT INTO matches (type, status, chain_group_id) VALUES ('chain', 'pending', ?)`).run(chainGroupId);
      const matchId = info.lastInsertRowid;
      for (const edge of edges) {
        const teachesSkill = edges.find((candidate) => candidate.toUserId === edge.fromUserId).skillFromToTo;
        db.prepare(`
          INSERT INTO match_participants (match_id, user_id, teaches_skill, receives_skill, accepted)
          VALUES (?, ?, ?, ?, 0)
        `).run(matchId, edge.fromUserId, teachesSkill, edge.skillFromToTo);
      }
      return matchId;
    });
    const matchId = tx();
    return Match.findById(matchId);
  },

  findById(id) {
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
    if (!match) return null;
    match.participants = db.prepare(`
      SELECT mp.*, u.name, u.email FROM match_participants mp
      JOIN users u ON u.id = mp.user_id
      WHERE mp.match_id = ?
    `).all(id);
    return match;
  },

  forUser(userId) {
    const ids = db.prepare('SELECT DISTINCT match_id FROM match_participants WHERE user_id = ?').all(userId).map((r) => r.match_id);
    return ids.map((id) => Match.findById(id));
  },

  isParticipant(matchId, userId) {
    return Boolean(db.prepare('SELECT 1 FROM match_participants WHERE match_id = ? AND user_id = ?').get(matchId, userId));
  },

  hasChainParticipants(userIds) {
    if (!userIds.length) return false;
    const placeholders = userIds.map(() => '?').join(',');
    const row = db.prepare(`
      SELECT m.id
      FROM matches m
      JOIN match_participants mp ON mp.match_id = m.id
      WHERE m.type = 'chain' AND mp.user_id IN (${placeholders})
      GROUP BY m.id
      HAVING COUNT(DISTINCT mp.user_id) = ? AND COUNT(*) = ?
      LIMIT 1
    `).get(...userIds, userIds.length, userIds.length);
    return Boolean(row);
  },

  accept(matchId, userId) {
    db.prepare('UPDATE match_participants SET accepted = 1 WHERE match_id = ? AND user_id = ?').run(matchId, userId);
    const participants = db.prepare('SELECT accepted FROM match_participants WHERE match_id = ?').all(matchId);
    const allAccepted = participants.every((p) => p.accepted === 1);
    if (allAccepted) {
      db.prepare(`UPDATE matches SET status = 'accepted' WHERE id = ?`).run(matchId);
    }
    return Match.findById(matchId);
  },

  decline(matchId, userId) {
    db.prepare(`
      UPDATE matches SET status = 'declined'
      WHERE id = ? AND status = 'pending'
        AND EXISTS (SELECT 1 FROM match_participants WHERE match_id = ? AND user_id = ?)
    `).run(matchId, matchId, userId);
    return Match.findById(matchId);
  },

  setStatus(matchId, status) {
    db.prepare('UPDATE matches SET status = ? WHERE id = ?').run(status, matchId);
  }
};

module.exports = Match;
