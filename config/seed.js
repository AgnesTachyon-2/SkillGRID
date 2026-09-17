// Optional: seeds a few demo users so you can try matching/chain-matching
// immediately after cloning. Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
const User = require('../models/User');

const demoUsers = [
  { name: 'Alice Reyes', email: 'alice@demo.edu', password: 'password123', mode: 'institutional', institution: 'ACLC College', offered: [{ skill_name: 'Guitar' }], wanted: ['Photography'] },
  { name: 'Ben Cruz', email: 'ben@demo.edu', password: 'password123', mode: 'institutional', institution: 'ACLC College', offered: [{ skill_name: 'Photography' }], wanted: ['Video Editing'] },
  { name: 'Cara Lim', email: 'cara@demo.edu', password: 'password123', mode: 'institutional', institution: 'ACLC College', offered: [{ skill_name: 'Video Editing' }], wanted: ['Guitar'] },
  { name: 'Dexter Uy', email: 'dexter@demo.com', password: 'password123', mode: 'public', offered: [{ skill_name: 'Web Development', hourly_rate: 15 }], wanted: ['UI Design'] },
  { name: 'Admin', email: 'admin@skillgrid.com', password: 'admin123', mode: 'public', isAdmin: true, offered: [], wanted: [] }
];

for (const u of demoUsers) {
  if (User.findByEmail(u.email)) continue;
  const passwordHash = bcrypt.hashSync(u.password, 10);
  const user = User.create({ name: u.name, email: u.email, passwordHash, mode: u.mode, institution: u.institution });
  User.setSkills(user.id, u.offered, u.wanted);
  if (u.isAdmin) {
    db.prepare('UPDATE users SET is_admin = 1, verified = 1 WHERE id = ?').run(user.id);
  } else {
    db.prepare('UPDATE users SET verified = 1 WHERE id = ?').run(user.id);
  }
  console.log(`Seeded ${u.email} / ${u.password}`);
}

console.log('Seed complete. Alice -> Ben -> Cara -> Alice is a ready-made chain match; try POST /api/matches/chain-search.');
