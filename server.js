require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');

require('./config/db'); // initializes schema on boot

const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const marketplaceRoutes = require('./routes/marketplace');
const matchRoutes = require('./routes/matches');
const sessionRoutes = require('./routes/sessions');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'local-development-only-secret';
const sessionCookieName = 'skillgrid_session';

if (isProduction && !process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not configured; set it in the deployment environment.');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function signSession(encodedPayload) {
  return crypto.createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url');
}

function readSessionCookie(value) {
  if (!value) return {};
  const [encodedPayload, signature] = value.split('.');
  if (!encodedPayload || !signature) return {};
  const expected = signSession(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return {};
  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

app.use((req, res, next) => {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
  req.session = readSessionCookie(cookies[sessionCookieName]);
  const originalEnd = res.end;
  res.end = function setSessionCookie(...args) {
    if (req.session === null) {
      res.setHeader('Set-Cookie', `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`);
    } else if (req.session.userId) {
      const encodedPayload = Buffer.from(JSON.stringify({ userId: req.session.userId, isAdmin: !!req.session.isAdmin })).toString('base64url');
      res.setHeader('Set-Cookie', `${sessionCookieName}=${encodedPayload}.${signSession(encodedPayload)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`);
    }
    return originalEnd.apply(this, args);
  };
  next();
});

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', pageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SkillGRID running at http://localhost:${PORT}`);
  });
}

module.exports = app;
