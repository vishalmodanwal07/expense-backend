import { pool } from "../db/db.js";

export const ExpenseModel = {

  // CREATE
  create: async (data) => {
    const result = await pool.query(
      `INSERT INTO expenses 
      (user_id, category, title, amount, currency, expense_date, payment_method, notes, vendor, receipt_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?)`,
      [
        data.user_id,
        data.category,
        data.title,
        data.amount,
        data.currency || "INR",
        data.expense_date,
        data.payment_method || "cash",
        data.notes || null,
        data.vendor || null,
        data.receipt_url || null
      ]
    );
    return result;
  },

  // TOTAL
  getAll: async (user_id) => {
  const rows = await pool.query(
    `SELECT SUM(amount) AS totalExpense
     FROM expenses
     WHERE user_id = ?`,
    [user_id]
  );
  return rows;
},


getAllExpenses: async (user_id, limit, offset, sort = "latest", category = "") => {

  let sortQuery = "ORDER BY expense_date DESC, id DESC";
  if (sort === "high") sortQuery = "ORDER BY amount DESC";
  if (sort === "low") sortQuery = "ORDER BY amount ASC";

  // ✅ Category filter
  let categoryFilter = "";
  let params = [user_id];

  if (category) {
    categoryFilter = "AND category = ?";
    params.push(category);
  }

  params.push(limit, offset);

  const rows = await pool.query(
    `SELECT id, user_id, category, title, amount, currency,
            DATE_FORMAT(expense_date, '%d-%m-%Y') AS expense_date,
            payment_method, notes, created_at, vendor, receipt_url
     FROM expenses
     WHERE user_id = ?
     ${categoryFilter}
     ${sortQuery}
     LIMIT ? OFFSET ?`,
    params
  );

  return rows;
},



  // GET SINGLE
  getById: async (id, user_id) => {
    const [rows] = await pool.query(
      "SELECT * FROM expenses WHERE id=? AND user_id=?",
      [id, user_id]
    );
    return rows;
  },

  // UPDATE
  update: async (id, user_id, data) => {
    // mariadb: query() returns a metadata object for UPDATE, not [rows, fields] — do not array-destructure
    const result = await pool.query(
      `UPDATE expenses SET 
        category=?,
        title=?,
        amount=?,
        currency=?,
        expense_date=?,
        payment_method=?,
        notes=?,
        vendor=?,
        receipt_url=?
       WHERE id=? AND user_id=?`,
      [
        data.category,
        data.title,
        data.amount,
        data.currency || "INR",
        data.expense_date,
        data.payment_method || "cash",
        data.notes || null,
        data.vendor || null,
        data.receipt_url || null,
        id,
        user_id
      ]
    );
    return result;
  },

  // DELETE
  delete: async (id, user_id) => {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id=? AND user_id=?",
      [id, user_id]
    );
    return result;
  },

  // SUMMARY (category wise)
  summary: async (userId) => {
    const [rows] = await pool.query(
      `SELECT *
       FROM expenses 
       WHERE user_id = ?`,
      [userId]
    );
    return rows;
  },

  getCategoryTotal: async (user_id, category) => {
  const rows = await pool.query(
    `SELECT category, SUM(amount) AS total
     FROM expenses
     WHERE user_id = ? AND category = ?
     GROUP BY category`,
    [user_id, category]
  );

  return rows;
},
getAllCategorySummary: async (user_id) => {
  const rows = await pool.query(
    `SELECT category, SUM(amount) AS total
     FROM expenses
     WHERE user_id = ?
     GROUP BY category
     ORDER BY total DESC`
    ,
    [user_id]
  );

  return rows;
},
};