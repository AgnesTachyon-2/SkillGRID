const User = require('../models/User');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');

exports.getMe = (req, res) => {
  const user = User.findById(req.session.userId);
  const profile = User.publicProfile(user);
  profile.averageRating = Review.averageRating(user.id);
  res.json({ user: profile });
};

exports.updateMe = (req, res) => {
  const { name, mode, institution, offered, wanted } = req.body;
  const user = User.updateProfile(req.session.userId, { name, mode, institution });
  if (offered || wanted) {
    User.setSkills(req.session.userId, offered || [], wanted || []);
  }
  res.json({ user: User.publicProfile(User.findById(req.session.userId)) });
};

exports.getMyTransactions = (req, res) => {
  res.json({ transactions: Transaction.forUser(req.session.userId) });
};

exports.getUser = (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const profile = User.publicProfile(user);
  profile.averageRating = Review.averageRating(user.id);
  profile.reviews = Review.forUser(user.id);
  res.json({ user: profile });
};
