const db = require('../config/db');

const User = {
  create({ name, email, passwordHash, mode, institution }) {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, mode, institution)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, email, passwordHash, mode, institution || null);
    return User.findById(info.lastInsertRowid);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  publicProfile(user) {
    if (!user) return null;
    const { password_hash, ...rest } = user;
    rest.offered = db.prepare('SELECT id, skill_name, hourly_rate FROM skills_offered WHERE user_id = ?').all(user.id);
    rest.wanted = db.prepare('SELECT id, skill_name FROM skills_wanted WHERE user_id = ?').all(user.id);
    return rest;
  },

  setSkills(userId, offered = [], wanted = []) {
    const delOffered = db.prepare('DELETE FROM skills_offered WHERE user_id = ?');
    const delWanted = db.prepare('DELETE FROM skills_wanted WHERE user_id = ?');
    const insOffered = db.prepare('INSERT INTO skills_offered (user_id, skill_name, hourly_rate) VALUES (?, ?, ?)');
    const insWanted = db.prepare('INSERT INTO skills_wanted (user_id, skill_name) VALUES (?, ?)');

    const tx = db.transaction(() => {
      delOffered.run(userId);
      delWanted.run(userId);
      for (const s of offered) {
        insOffered.run(userId, s.skill_name, s.hourly_rate || 0);
      }
      for (const s of wanted) {
        insWanted.run(userId, typeof s === 'string' ? s : s.skill_name);
      }
    });
    tx();
  },

  updateProfile(userId, { name, mode, institution, verified }) {
    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        mode = COALESCE(?, mode),
        institution = COALESCE(?, institution),
        verified = COALESCE(?, verified)
      WHERE id = ?
    `).run(name, mode, institution, verified, userId);
    return User.findById(userId);
  },

  adjustBalance(userId, ledger, amount) {
    const col = ledger === 'token' ? 'token_balance' : 'fiat_balance';
    db.prepare(`UPDATE users SET ${col} = ${col} + ? WHERE id = ?`).run(amount, userId);
  },

  incrementNoShow(userId) {
    db.prepare('UPDATE users SET no_show_count = no_show_count + 1 WHERE id = ?').run(userId);
  },

  listAllWithSkills() {
    const users = db.prepare('SELECT id FROM users').all();
    return users.map((u) => {
      const offered = db.prepare('SELECT skill_name FROM skills_offered WHERE user_id = ?').all(u.id).map((r) => r.skill_name);
      const wanted = db.prepare('SELECT skill_name FROM skills_wanted WHERE user_id = ?').all(u.id).map((r) => r.skill_name);
      return { id: u.id, offered, wanted };
    });
  },

  searchMarketplace({ skill, mode }) {
    let query = `
      SELECT DISTINCT u.id, u.name, u.mode, u.institution, u.verified
      FROM users u
      JOIN skills_offered so ON so.user_id = u.id
    `;
    const params = [];
    const conditions = [];
    if (skill) {
      conditions.push('so.skill_name LIKE ?');
      params.push(`%${skill}%`);
    }
    if (mode) {
      conditions.push('u.mode = ?');
      params.push(mode);
    }
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    const rows = db.prepare(query).all(...params);
    return rows.map((u) => User.publicProfile({ ...u, password_hash: '' }));
  }
};

module.exports = User;
