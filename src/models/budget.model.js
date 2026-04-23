import { getCurrentMonth } from '../../utils/get-curr-month.js';
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
 getBudget: async (user_id) => {
  const rows = await pool.query(
    `SELECT amount_limit FROM budgets
     WHERE user_id = ?
     AND month = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`,
    [user_id]
  );

  return rows[0]?.amount_limit || 0;
},

  getMonthlyTotal: async (user_id) => {
    const current = getCurrentMonth();
  const rows = await pool.query(
    `SELECT COALESCE(SUM(amount),0) as total
     FROM expenses
     WHERE user_id = ?
      AND DATE_FORMAT(expense_date, '%Y-%m') = ?`,
    [user_id, current]
  );
  return rows[0].total;
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