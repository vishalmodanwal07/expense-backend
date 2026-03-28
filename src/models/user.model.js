
import bcrypt from 'bcrypt';
import { pool } from '../db/db.js';

export const UserModel = {
  create: async ({ name, email, password }) => {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );
    return result;
  },

  findByEmail: async (email) => {
    const rows = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    return rows[0];
  },

  findById: async (id) => {
    const rows = await pool.query('SELECT * FROM users WHERE id=?', [id]);
    return rows[0];
  }
};