
import bcrypt from 'bcrypt';
import { pool } from '../db/db.js';

export const UserModel = {
  create: async ({ name, email, password, mobile }) => {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, mobile) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, mobile]
    );
    return result;
  },

  findByEmail: async (email) => {
    const rows = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    return rows[0];
  },

  findByMobile: async (mobile) => {
    const rows = await pool.query('SELECT * FROM users WHERE mobile=?', [mobile]);
    return rows[0];
  },

  /** Row for a *different* user with this mobile (excludes current profile updates). */
  findOtherUserByMobile: async (mobile, excludeUserId) => {
    const rows = await pool.query(
      'SELECT id FROM users WHERE mobile = ? AND id <> ?',
      [mobile, excludeUserId]
    );
    return rows[0];
  },

  findById: async (id) => {
    const rows = await pool.query(
      'SELECT email, name, id, mobile, role FROM users WHERE id=?',
      [id]
    );
    return rows[0];
  },

  findByIdFull: async (id) => {
    const rows = await pool.query('SELECT * FROM users WHERE id=?', [id]);
    return rows[0];
  },

  updateName: async (id, name) => {
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
  },

  updateMobile: async (id, mobile) => {
    await pool.query('UPDATE users SET mobile = ? WHERE id = ?', [mobile, id]);
  },

  updatePasswordHash: async (id, password_hash) => {
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      password_hash,
      id
    ]);
  }
};