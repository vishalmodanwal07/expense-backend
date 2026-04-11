import {pool} from "../db/db.js";

export const ExpenseModel = {

  create: async (data) => {
    return await pool.query(
      `INSERT INTO expenses 
      (user_id, category_id, title, amount, currency, expense_date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.category_id || null,
        data.title,
        data.amount,
        data.currency || "INR",
        data.expense_date,
        data.payment_method || "cash",
        data.notes || null
      ]
    );
  },

  getAll: async (user_id) => {
    return await pool.query(
      `SELECT SUM(amount) AS totalExpense
      FROM expenses
      WHERE user_id = ?`
      [user_id]
    );
  },

  getById: async (id, user_id) => {
    const rows = await pool.query(
      "SELECT * FROM expenses WHERE id=? AND user_id=?",
      [id, user_id]
    );
    return rows[0];
  },

  update: async (id, user_id, data) => {
    return await pool.query(
      `UPDATE expenses SET 
        category_id=?,
        title=?,
        amount=?,
        currency=?,
        expense_date=?,
        payment_method=?,
        notes=?
       WHERE id=? AND user_id=?`,
      [
        data.category_id || null,
        data.title,
        data.amount,
        data.currency,
        data.expense_date,
        data.payment_method,
        data.notes,
        id,
        user_id
      ]
    );
  },

  delete: async (id, user_id) => {
    return await pool.query(
      "DELETE FROM expenses WHERE id=? AND user_id=?",
      [id, user_id]
    );
  }
};