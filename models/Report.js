const db = require('../config/db');

const Report = {
  create({ reporterId, reportedId, reason }) {
    const info = db.prepare(`
      INSERT INTO reports (reporter_id, reported_id, reason)
      VALUES (?, ?, ?)
    `).run(reporterId, reportedId, reason);
    return db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid);
  },

  all(status) {
    if (status) {
      return db.prepare(`
        SELECT rp.*, u1.name AS reporter_name, u2.name AS reported_name
        FROM reports rp
        JOIN users u1 ON u1.id = rp.reporter_id
        JOIN users u2 ON u2.id = rp.reported_id
        WHERE rp.status = ?
        ORDER BY rp.created_at DESC
      `).all(status);
    }
    return db.prepare(`
      SELECT rp.*, u1.name AS reporter_name, u2.name AS reported_name
      FROM reports rp
      JOIN users u1 ON u1.id = rp.reporter_id
      JOIN users u2 ON u2.id = rp.reported_id
      ORDER BY rp.created_at DESC
    `).all();
  },

  setStatus(id, status) {
    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, id);
  }
};

module.exports = Report;
