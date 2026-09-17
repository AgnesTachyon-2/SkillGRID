const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const databaseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'skillgrid-test-'));
process.env.DB_PATH = path.join(databaseDirectory, 'skillgrid.db');
process.env.SESSION_SECRET = 'test-secret';

const db = require('../config/db');
const Match = require('../models/Match');
const Session = require('../models/Session');
const { findChainMatches } = require('../utils/chainMatcher');

test.after(() => {
  db.close();
  fs.rmSync(databaseDirectory, { recursive: true, force: true });
});

test('chain matches assign each user their incoming teaching skill and outgoing requested skill', () => {
  const users = [
    { id: 1, offered: ['HTML'], wanted: ['SQL'] },
    { id: 2, offered: ['SQL'], wanted: ['CSS'] },
    { id: 3, offered: ['CSS'], wanted: ['HTML'] }
  ];
  const cycle = findChainMatches(users, { maxChainLength: 3 })[0];
  assert.deepEqual(cycle.edges, [
    { fromUserId: 1, toUserId: 2, skillFromToTo: 'SQL' },
    { fromUserId: 2, toUserId: 3, skillFromToTo: 'CSS' },
    { fromUserId: 3, toUserId: 1, skillFromToTo: 'HTML' }
  ]);

  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (1, 'A', 'a@test', 'x'), (2, 'B', 'b@test', 'x'), (3, 'C', 'c@test', 'x')").run();
  const match = Match.createChain('test-chain', cycle.edges);
  assert.deepEqual(match.participants.map((participant) => [participant.user_id, participant.teaches_skill, participant.receives_skill]), [
    [1, 'HTML', 'SQL'],
    [2, 'SQL', 'CSS'],
    [3, 'CSS', 'HTML']
  ]);
});

test('session status can only transition once', () => {
  const match = Match.createDirect({
    userAId: 1,
    userBId: 2,
    aTeaches: 'HTML',
    bTeaches: 'SQL'
  });
  db.prepare("UPDATE matches SET status = 'accepted' WHERE id = ?").run(match.id);
  const session = Session.create({
    matchId: match.id,
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    meetingLink: 'https://example.test/meeting',
    price: 10
  });

  assert.equal(Session.setStatus(session.id, 'completed').changes, 1);
  assert.equal(Session.setStatus(session.id, 'completed').changes, 0);
});