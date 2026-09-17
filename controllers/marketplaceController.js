const User = require('../models/User');

exports.search = (req, res) => {
  const { skill, mode } = req.query;
  const results = User.searchMarketplace({ skill, mode });
  res.json({ results });
};
