import pool from '../db/db.js';

export const ExpenseModel = {
  create: async (expense) => {
    const result = await pool.query(
      `INSERT INTO expenses 
        (user_id, category_id, title, amount, currency, expense_date, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.user_id,
        expense.category_id || null,
        expense.title,
        expense.amount,
        expense.currency || 'INR',
        expense.expense_date,
        expense.payment_method || 'cash',
        expense.notes || null
      ]
    );
    return result;
  },

  getAllByUser: async (user_id) => {
    return await pool.query(
      'SELECT e.*, c.name AS category_name, c.color AS category_color FROM expenses e LEFT JOIN categories c ON e.category_id=c.id WHERE e.user_id=? ORDER BY e.expense_date DESC',
      [user_id]
    );
  },

  getById: async (id, user_id) => {
    const rows = await pool.query(
      'SELECT * FROM expenses WHERE id=? AND user_id=?',
      [id, user_id]
    );
    return rows[0];
  },

  update: async (id, user_id, data) => {
    return await pool.query(
      `UPDATE expenses SET title=?, amount=?, category_id=?, currency=?, expense_date=?, payment_method=?, notes=? 
       WHERE id=? AND user_id=?`,
      [
        data.title,
        data.amount,
        data.category_id || null,
        data.currency || 'INR',
        data.expense_date,
        data.payment_method || 'cash',
        data.notes || null,
        id,
        user_id
      ]
    );
  },

  delete: async (id, user_id) => {
    return await pool.query('DELETE FROM expenses WHERE id=? AND user_id=?', [id, user_id]);
  }
};