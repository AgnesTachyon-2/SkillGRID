const db = require('../config/db');

const Review = {
  exists({ sessionId, reviewerId, revieweeId }) {
    return Boolean(db.prepare(`
      SELECT 1 FROM reviews
      WHERE session_id = ? AND reviewer_id = ? AND reviewee_id = ?
    `).get(sessionId, reviewerId, revieweeId));
  },

  create({ sessionId, reviewerId, revieweeId, rating, comment }) {
    const info = db.prepare(`
      INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, reviewerId, revieweeId, rating, comment || null);
    return db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);
  },

  forUser(userId) {
    return db.prepare(`
      SELECT r.*, u.name AS reviewer_name FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);
  },

  averageRating(userId) {
    const row = db.prepare('SELECT AVG(rating) AS avg FROM reviews WHERE reviewee_id = ?').get(userId);
    return row.avg ? Math.round(row.avg * 10) / 10 : null;
  }
};

module.exports = Review;
