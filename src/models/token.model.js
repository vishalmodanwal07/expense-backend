import { pool } from '../db/db.js';

export const TokenModel = {

  create: async ({ user_id, token, expires_at }) => {
    return await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user_id, token, expires_at]
    );
  },

  deleteByUser: async (user_id) => {
  return await pool.query(
    "DELETE FROM refresh_tokens WHERE user_id=?",
    [user_id]
  );
},

  findValidToken: async ({ user_id, token }) => {
    const rows = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id=? AND token=? AND expires_at > NOW()',
      [user_id, token]
    );
    return rows[0];
  },

  deleteToken: async (token) => {
    return await pool.query(
      'DELETE FROM refresh_tokens WHERE token=?',
      [token]
    );
  }

};