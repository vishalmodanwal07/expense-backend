import pool from '../db/db.js';

export const BudgetModel = {
  createOrUpdate: async ({ user_id, category_id, month, amount_limit }) => {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, month, amount_limit) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount_limit=?`,
      [user_id, category_id, month, amount_limit, amount_limit]
    );
    return result;
  },

  getAllByUser: async (user_id) => {
    return await pool.query(
      `SELECT b.*, c.name AS category_name, c.color AS category_color 
       FROM budgets b 
       JOIN categories c ON b.category_id=c.id 
       WHERE b.user_id=?`,
      [user_id]
    );
  },

  getByMonth: async (user_id, month) => {
    return await pool.query('SELECT * FROM budgets WHERE user_id=? AND month=?', [user_id, month]);
  },

  delete: async (id, user_id) => {
    return await pool.query('DELETE FROM budgets WHERE id=? AND user_id=?', [id, user_id]);
  }
};