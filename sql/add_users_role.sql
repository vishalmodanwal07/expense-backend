-- Role for routing (e.g. admin profile vs user profile). Default matches existing users.
ALTER TABLE users
  ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user' AFTER mobile;

-- Optional: promote specific accounts after deploy, e.g.:
-- UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
