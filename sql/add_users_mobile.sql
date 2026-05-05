-- Run once against your expense DB (MariaDB/MySQL).
-- Adds mobile for signup / profile; unique when set (multiple NULL allowed for legacy rows).

ALTER TABLE users
  ADD COLUMN mobile VARCHAR(16) NULL AFTER email;

ALTER TABLE users
  ADD UNIQUE KEY uq_users_mobile (mobile);
