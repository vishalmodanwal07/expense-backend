import pool from '../db/db.js';

export const CategoryModel = {
  create: async ({ user_id, name, color }) => {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
      [user_id, name, color || '#6366f1']
    );
    return result;
  },

  getAllByUser: async (user_id) => {
    return await pool.query('SELECT * FROM categories WHERE user_id=?', [user_id]);
  },

  getById: async (id, user_id) => {
    const rows = await pool.query('SELECT * FROM categories WHERE id=? AND user_id=?', [id, user_id]);
    return rows[0];
  },

  update: async (id, user_id, data) => {
    return await pool.query(
      'UPDATE categories SET name=?, color=? WHERE id=? AND user_id=?',
      [data.name, data.color, id, user_id]
    );
  },

  delete: async (id, user_id) => {
    return await pool.query('DELETE FROM categories WHERE id=? AND user_id=?', [id, user_id]);
  }
};