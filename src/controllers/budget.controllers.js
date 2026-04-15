import { getCurrentMonth } from "../../utils/get-curr-month.js";
import {BudgetModel} from "../models/budget.model.js";
import { pool } from "../db/db.js";

export const setBudget = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { month, amount_limit } = req.body;

    // ✅ validation
    if (!month || !amount_limit) {
      return res.status(400).json({
        message: "month, amount_limit required"
      });
    }

    if (amount_limit <= 0) {
      return res.status(400).json({
        message: "amount_limit must be greater than 0"
      });
    }

    // 🔥 CURRENT MONTH CHECK
    const currentMonth = getCurrentMonth();

    if (month !== currentMonth) {
      return res.status(400).json({
        message: "❌ Please select current month only. Budget can be set only for this month."
      });
    }

    // ✅ SAVE
    await BudgetModel.createOrUpdate({
      user_id,
      month,
      amount_limit
    });

    res.status(200).json({
      message: "✅ Budget set successfully for current month"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [data] = await BudgetModel.getAllByUser(user_id);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgetByMonth = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { month } = req.query;

    const data = await BudgetModel.getByMonth(user_id, month);

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgetSummary = async (req, res) => {
  try {
    const user_id = req.user.id;
    const  month  = getCurrentMonth();

    if (!month) {
      return res.status(400).json({
        message: "month required (YYYY-MM)"
      });
    }

    // 🔥 CURRENT MONTH CHECK
    const currentMonth = getCurrentMonth();

    if (month !== currentMonth) {
      return res.status(400).json({
        message: "❌ Only current month allowed"
      });
    }

    // ✅ budget
    const budgetData = await pool.query(
      "SELECT amount_limit FROM budgets WHERE user_id=? AND month=?",
      [user_id, month]
    );

    const budget = budgetData[0]?.amount_limit || 0;

    // ✅ total expense
    const expenseData = await pool.query(
      `SELECT SUM(amount) as total 
       FROM expenses 
       WHERE user_id=? 
       AND DATE_FORMAT(expense_date, '%Y-%m')=?`,
      [user_id, month]
    );

    const spent = expenseData[0].total || 0;

    res.json({
      budget,
      spent,
      remaining: budget - spent
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





export const updateCurrentMonthBudget = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { amount_limit } = req.body;

    // ✅ validation
    if (!amount_limit) {
      return res.status(400).json({
        message: "amount_limit is required"
      });
    }

    if (amount_limit <= 0) {
      return res.status(400).json({
        message: "amount_limit must be greater than 0"
      });
    }

    const currentMonth = getCurrentMonth();

    // ✅ create OR update (same query handles both)
    await BudgetModel.createOrUpdate({
      user_id,
      month: currentMonth,   // 🔥 auto set
      amount_limit
    });

    res.status(200).json({
      message: "✅ Budget updated for current month",
      month: currentMonth
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const getCurrentMonthBudget = async (req, res) => {
  try {
    const user_id = req.user.id;
    const currentMonth = getCurrentMonth();

    const data = await BudgetModel.getByMonth(user_id, currentMonth);

    res.json(data[0] || { amount_limit: 0 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};