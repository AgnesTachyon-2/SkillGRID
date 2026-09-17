const db = require('../config/db');
const Report = require('../models/Report');

exports.createReport = (req, res) => {
  const { reportedId, reason } = req.body;
  if (!reportedId || !reason) {
    return res.status(400).json({ error: 'reportedId and reason are required' });
  }
  const report = Report.create({ reporterId: req.session.userId, reportedId, reason });
  res.json({ report });
};

exports.listReports = (req, res) => {
  const { status } = req.query;
  res.json({ reports: Report.all(status) });
};

exports.resolveReport = (req, res) => {
  const { status } = req.body; // 'resolved' or 'dismissed'
  Report.setStatus(req.params.id, status || 'resolved');
  res.json({ success: true });
};

exports.getConfig = (req, res) => {
  const rows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  rows.forEach((r) => { config[r.key] = r.value; });
  res.json({ config });
};

exports.updateConfig = (req, res) => {
  const { key, value } = req.body;
  if (!['token_valuation', 'platform_commission_pct'].includes(key)) {
    return res.status(400).json({ error: 'Unsupported configuration key' });
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0 || (key === 'platform_commission_pct' && numericValue > 100)) {
    return res.status(400).json({ error: 'Configuration value is invalid' });
  }
  db.prepare('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(numericValue));
  res.json({ success: true });
};

exports.analytics = (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const institutionalCount = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE mode = 'institutional'`).get().c;
  const publicCount = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE mode = 'public'`).get().c;
  const matchCount = db.prepare('SELECT COUNT(*) AS c FROM matches').get().c;
  const chainMatchCount = db.prepare(`SELECT COUNT(*) AS c FROM matches WHERE type = 'chain'`).get().c;
  const completedSessions = db.prepare(`SELECT COUNT(*) AS c FROM sessions WHERE status = 'completed'`).get().c;
  const noShowCount = db.prepare(`SELECT COUNT(*) AS c FROM sessions WHERE status = 'no_show'`).get().c;
  const openReports = db.prepare(`SELECT COUNT(*) AS c FROM reports WHERE status = 'open'`).get().c;
  const commissionPct = Number(db.prepare("SELECT value FROM config WHERE key = 'platform_commission_pct'").get()?.value);
  const totalCommissionEarned = db.prepare(`
    SELECT COALESCE(SUM(price), 0) AS total FROM sessions WHERE paid = 1
  `).get().total * (Number.isFinite(commissionPct) ? commissionPct / 100 : 0);

  res.json({
    userCount,
    institutionalCount,
    publicCount,
    matchCount,
    chainMatchCount,
    completedSessions,
    noShowCount,
    openReports,
    estimatedPlatformFeesEarned: Math.round(totalCommissionEarned * 100) / 100
  });
};
