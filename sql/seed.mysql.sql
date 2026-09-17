-- SkillGRID demo data for MySQL/MariaDB
-- Run schema.mysql.sql first.
-- Demo password for all imported accounts: password
USE skillgrid;

INSERT INTO users (name, email, password_hash, mode, institution, verified, is_admin)
VALUES
  ('Alice Reyes', 'alice@demo.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'institutional', 'ACLC College', 1, 0),
  ('Ben Cruz', 'ben@demo.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'institutional', 'ACLC College', 1, 0),
  ('Cara Lim', 'cara@demo.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'institutional', 'ACLC College', 1, 0),
  ('Dexter Uy', 'dexter@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'public', NULL, 1, 0),
  ('Admin', 'admin@skillgrid.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'public', NULL, 1, 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO skills_offered (user_id, skill_name, hourly_rate)
SELECT id, 'Guitar', 0 FROM users WHERE email = 'alice@demo.edu'
  AND NOT EXISTS (SELECT 1 FROM skills_offered s WHERE s.user_id = users.id AND s.skill_name = 'Guitar');
INSERT INTO skills_offered (user_id, skill_name, hourly_rate)
SELECT id, 'Photography', 0 FROM users WHERE email = 'ben@demo.edu'
  AND NOT EXISTS (SELECT 1 FROM skills_offered s WHERE s.user_id = users.id AND s.skill_name = 'Photography');
INSERT INTO skills_offered (user_id, skill_name, hourly_rate)
SELECT id, 'Video Editing', 0 FROM users WHERE email = 'cara@demo.edu'
  AND NOT EXISTS (SELECT 1 FROM skills_offered s WHERE s.user_id = users.id AND s.skill_name = 'Video Editing');
INSERT INTO skills_offered (user_id, skill_name, hourly_rate)
SELECT id, 'Web Development', 15 FROM users WHERE email = 'dexter@demo.com'
  AND NOT EXISTS (SELECT 1 FROM skills_offered s WHERE s.user_id = users.id AND s.skill_name = 'Web Development');

INSERT INTO skills_wanted (user_id, skill_name)
SELECT id, 'Photography' FROM users WHERE email = 'alice@demo.edu'
  AND NOT EXISTS (SELECT 1 FROM skills_wanted s WHERE s.user_id = users.id AND s.skill_name = 'Photography');
INSERT INTO skills_wanted (user_id, skill_name)
SELECT id, 'Video Editing' FROM users WHERE email = 'ben@demo.edu'
  AND NOT EXISTS (SELECT 1 FROM skills_wanted s WHERE s.user_id = users.id AND s.skill_name = 'Video Editing');
INSERT INTO skills_wanted (user_id, skill_name)
SELECT id, 'Guitar' FROM users WHERE email = 'cara@demo.edu'
  AND NOT EXISTS (SELECT 1 FROM skills_wanted s WHERE s.user_id = users.id AND s.skill_name = 'Guitar');
INSERT INTO skills_wanted (user_id, skill_name)
SELECT id, 'UI Design' FROM users WHERE email = 'dexter@demo.com'
  AND NOT EXISTS (SELECT 1 FROM skills_wanted s WHERE s.user_id = users.id AND s.skill_name = 'UI Design');

SELECT 'Seed complete. Demo accounts use password: password.' AS message;
