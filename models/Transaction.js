const db = require('../config/db');

const Transaction = {
  record({ userId, ledger, amount, description, sessionId }) {
    db.prepare(`
      INSERT INTO transactions (user_id, ledger, amount, description, session_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, ledger, amount, description || null, sessionId || null);
  },

  forUser(userId) {
    return db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }
};

module.exports = Transaction;
