import { BudgetModel } from "../models/budget.model.js";
import { CategoryModel } from "../models/category.model.js";

export const setBudget = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { category_id, month, amount_limit } = req.body;

    // ✅ validation
    if (!category_id || !month || !amount_limit) {
      return res.status(400).json({
        message: "category_id, month, amount_limit required"
      });
    }

    if (amount_limit <= 0) {
      return res.status(400).json({
        message: "amount_limit must be greater than 0"
      });
    }

    // ✅ category exist check (IMPORTANT)
    const category = await pool.query(
      "SELECT id FROM categories WHERE id=?",
      [category_id]
    );

    if (category.length === 0) {
      return res.status(400).json({
        message: "Invalid category_id"
      });
    }

    await BudgetModel.createOrUpdate({
      user_id,
      category_id,
      month,
      amount_limit
    });

    res.status(200).json({
      message: "Budget set successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const user_id = req.user.id;

    const data = await pool.query(
      `SELECT b.*, c.name AS category_name, c.color 
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id=?`,
      [user_id]
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgetByMonth = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { month } = req.query;

    const data = await pool.query(
      `SELECT b.*, c.name AS category_name 
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id=? AND b.month=?`,
      [user_id, month]
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    await BudgetModel.delete(id, user_id);

    res.json({
      message: "Budget deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getBudgetSummary = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        message: "month required (YYYY-MM)"
      });
    }

    // 🔥 Step 1: budgets fetch
    const budgets = await pool.query(
      "SELECT * FROM budgets WHERE user_id=? AND month=?",
      [user_id, month]
    );

    const result = [];

    // 🔥 Step 2: loop budgets
    for (let b of budgets) {

      // 🔥 Step 3: expense total
      const expense = await pool.query(
        `SELECT SUM(amount) as total 
         FROM expenses 
         WHERE user_id=? 
         AND category_id=? 
         AND DATE_FORMAT(expense_date, '%Y-%m')=?`,
        [user_id, b.category_id, month]
      );

      const spent = expense[0].total || 0;

      result.push({
        category_id: b.category_id,
        budget: b.amount_limit,
        spent,
        remaining: b.amount_limit - spent
      });
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};