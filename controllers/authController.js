const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.register = (req, res) => {
  const { name, email, password, mode, institution, consent } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (consent !== 'on' && consent !== true) {
    return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy' });
  }
  if (mode === 'institutional' && !institution) {
    return res.status(400).json({ error: 'Institution is required for institutional mode' });
  }
  if (User.findByEmail(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = User.create({ name, email, passwordHash, mode: mode === 'institutional' ? 'institutional' : 'public', institution });

  req.session.userId = user.id;
  req.session.isAdmin = !!user.is_admin;
  res.json({ user: User.publicProfile(user) });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = User.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  req.session.userId = user.id;
  req.session.isAdmin = !!user.is_admin;
  res.json({ user: User.publicProfile(user) });
};

exports.logout = (req, res) => {
  req.session = null;
  res.json({ success: true });
};

exports.me = (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = User.findById(req.session.userId);
  res.json({ user: User.publicProfile(user) });
};
