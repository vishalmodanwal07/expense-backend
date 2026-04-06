import { pool } from '../db/db.js';

export const BudgetModel = {

  // ✅ CREATE OR UPDATE (monthly budget)
  createOrUpdate: async ({ user_id, month, amount_limit }) => {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, month, amount_limit) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount_limit = ?`,
      [user_id, month, amount_limit , amount_limit]   // ✅ fixed params
    );
    return result;
  },

  // ✅ GET ALL BUDGETS (no category join)
  getAllByUser: async (user_id) => {
    return await pool.query(
      `SELECT * 
       FROM budgets 
       WHERE user_id = ?
       ORDER BY month DESC`,
      [user_id]
    );
  },

  // ✅ GET BY MONTH
  getByMonth: async (user_id, month) => {
    return await pool.query(
      `SELECT * 
       FROM budgets 
       WHERE user_id = ? AND month = ?`,
      [user_id, month]
    );
  },

  // ✅ DELETE
  delete: async (id, user_id) => {
    return await pool.query(
      `DELETE FROM budgets 
       WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );
  }
};