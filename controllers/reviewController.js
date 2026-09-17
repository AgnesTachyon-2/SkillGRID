const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');

exports.create = (req, res) => {
  const sessionId = Number(req.body.sessionId);
  const revieweeId = Number(req.body.revieweeId);
  const rating = Number(req.body.rating);
  const { comment } = req.body;
  if (!Number.isInteger(sessionId) || !Number.isInteger(revieweeId) || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'sessionId, revieweeId, and rating are required' });
  }
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be between 1 and 5' });
  const session = Session.findById(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'completed') return res.status(400).json({ error: 'Reviews require a completed session' });
  if (revieweeId === req.session.userId || !User.findById(revieweeId)) {
    return res.status(400).json({ error: 'revieweeId must identify another user' });
  }
  if (!Session.hasParticipant(sessionId, req.session.userId) || !Session.hasParticipant(sessionId, revieweeId)) {
    return res.status(403).json({ error: 'Reviews are limited to session participants' });
  }
  if (Review.exists({ sessionId, reviewerId: req.session.userId, revieweeId })) {
    return res.status(409).json({ error: 'You already reviewed this participant for this session' });
  }
  const review = Review.create({
    sessionId,
    reviewerId: req.session.userId,
    revieweeId,
    rating,
    comment
  });
  res.json({ review });
};

exports.forUser = (req, res) => {
  const reviews = Review.forUser(req.params.userId);
  res.json({ reviews });
};
