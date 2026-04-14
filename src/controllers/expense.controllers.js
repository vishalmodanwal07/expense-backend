import { pool } from "../db/db.js";
import { getInsights } from "../../utils/AiSummary.js";
import { ExpenseModel } from "../models/expense.model.js";
import { BudgetModel } from "../models/budget.model.js";

//  Create Expense
export const createExpense = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      title,
      amount,
      expense_date,
      category,
      currency,
      payment_method,
      notes
    } = req.body;

    // basic validation
    if (!title || !amount || !expense_date || !category) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    //  get budget
    const budget = await BudgetModel.getBudget(user_id);

    //  get current spent
    const totalSpent = await BudgetModel.getMonthlyTotal(user_id);

    //  check limit
    if (totalSpent + amount > budget) {
      return res.status(400).json({
        message: "Budget exceeded and expense is not created",
        budget,
        spent: totalSpent,
        remaining: budget - totalSpent
      });
    }

    // ✅ create expense
    const result = await ExpenseModel.create({
      user_id,
      title,
      amount,
      expense_date,
      category,
      currency,
      payment_method,
      notes
    });

    return res.status(201).json({
      message: "Expense created ✅",
      id: result.insertId
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};


// Get All Expenses
export const getExpenses = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [data] = await ExpenseModel.getAll(user_id);

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 📄 Get Single Expense
export const getExpense = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const expense = await ExpenseModel.getById(id, user_id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update Expense
export const updateExpense = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const {
      title,
      amount,
      expense_date,
      category_id,
      currency,
      payment_method,
      notes
    } = req.body;

    if (amount && amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    const existing = await ExpenseModel.getById(id, user_id);

    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // ✅ optional category check
    if (category_id) {
      const category = await pool.query(
        "SELECT id FROM categories WHERE id=?",
        [category_id]
      );

      if (category.length === 0) {
        return res.status(400).json({
          message: "Invalid category_id"
        });
      }
    }

    await ExpenseModel.update(id, user_id, {
      title: title || existing.title,
      amount: amount || existing.amount,
      expense_date: expense_date || existing.expense_date,
      category_id: category_id ?? existing.category_id,
      currency: currency || existing.currency,
      payment_method: payment_method || existing.payment_method,
      notes: notes ?? existing.notes
    });

    res.json({ message: "Expense updated successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Delete Expense
export const deleteExpense = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const existing = await ExpenseModel.getById(id, user_id);

    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await ExpenseModel.delete(id, user_id);

    res.json({ message: "Expense deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTotalExpense = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      "SELECT SUM(amount) as total FROM expenses WHERE user_id=?",
      [user_id]
    );

    res.json({
      total: result[0].total || 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAllExpenses = async (req, res) => {
  try {
    const user_id = req.user.id;

    // pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    // data fetch
    const expenses = await ExpenseModel.getAllExpenses(user_id, limit, offset);

    // total count (for frontend pagination)
    const totalRows = await pool.query(
      `SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?`,
      [user_id]
    );

    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages,
      count: expenses.length,
      data: expenses
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};


export const getSummary = async (req , res) => {
  const id = req.user.id;
  const insightData = ExpenseModel.summary(id);
 const summary =  await getInsights(insightData);
 console.log(summary);
 if(!summary){
  return res.status(500).json({
    message : "failed to generate summary"
  })
 }

 return res
       .status(201)
       .json({
        message : "summary generated succesfully",
        summary : summary
       })
}