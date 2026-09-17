const express = require('express');
const router = express.Router();
const path = require('path');

const pages = ['index', 'login', 'register', 'dashboard', 'marketplace', 'matches', 'sessions', 'admin', 'privacy', 'terms', 'refunds', 'cookies'];
pages.forEach((page) => {
  const route = page === 'index' ? '/' : `/${page}`;
  router.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', `${page}.html`));
  });
});

module.exports = router;
