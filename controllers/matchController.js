const { randomUUID } = require('crypto');
const Match = require('../models/Match');
const User = require('../models/User');
const { findChainMatches } = require('../utils/chainMatcher');

exports.proposeDirect = (req, res) => {
  const targetUserId = Number(req.body.targetUserId);
  const { myTeachSkill, theirTeachSkill } = req.body;
  if (!targetUserId || !myTeachSkill || !theirTeachSkill) {
    return res.status(400).json({ error: 'targetUserId, myTeachSkill, and theirTeachSkill are required' });
  }
  if (targetUserId === req.session.userId) {
    return res.status(400).json({ error: 'You cannot propose a match with yourself' });
  }
  const target = User.publicProfile(User.findById(targetUserId));
  const currentUser = User.publicProfile(User.findById(req.session.userId));
  if (!target || !currentUser) return res.status(404).json({ error: 'User not found' });
  if (!currentUser.offered.some((skill) => skill.skill_name === myTeachSkill)) {
    return res.status(400).json({ error: 'You can only offer a skill on your profile' });
  }
  if (!target.offered.some((skill) => skill.skill_name === theirTeachSkill)) {
    return res.status(400).json({ error: 'The target user does not offer that skill' });
  }
  const match = Match.createDirect({
    userAId: req.session.userId,
    userBId: targetUserId,
    aTeaches: myTeachSkill,
    bTeaches: theirTeachSkill
  });
  res.json({ match });
};

exports.mine = (req, res) => {
  const matches = Match.forUser(req.session.userId);
  res.json({ matches });
};

exports.accept = (req, res) => {
  if (!Match.isParticipant(req.params.id, req.session.userId)) {
    return res.status(403).json({ error: 'Only match participants can accept a match' });
  }
  const match = Match.accept(req.params.id, req.session.userId);
  res.json({ match });
};

exports.decline = (req, res) => {
  if (!Match.isParticipant(req.params.id, req.session.userId)) {
    return res.status(403).json({ error: 'Only match participants can decline a match' });
  }
  const match = Match.decline(req.params.id, req.session.userId);
  res.json({ match });
};

// Runs the background chain-matching algorithm across all users' offered/wanted
// skills and creates pending chain matches for any newly discovered cycles.
exports.runChainSearch = (req, res) => {
  const users = User.listAllWithSkills();
  const cycles = findChainMatches(users, { maxChainLength: 5 });

  const created = [];
  for (const cycle of cycles) {
    if (Match.hasChainParticipants(cycle.participants)) continue;
    const groupId = randomUUID();
    const match = Match.createChain(groupId, cycle.edges);
    created.push(match);
  }
  res.json({ chainsFound: cycles.length, matches: created });
};
