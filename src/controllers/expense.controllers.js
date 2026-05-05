import { pool } from "../db/db.js";
import { getInsights } from "../../utils/AiSummary.js";
import { ExpenseModel } from "../models/expense.model.js";
import { BudgetModel } from "../models/budget.model.js";
import { UserModel } from "../models/user.model.js";
import { userHasValidContactForExpenses } from "../../utils/contactValidation.js";
import { io } from "../../server.js";

const CONTACT_FOR_EXPENSE_MSG =
  "Add a valid email and 10-digit Indian mobile on your profile before recording expenses.";

async function assertUserMayWriteExpense(userId) {
  const owner = await UserModel.findByIdFull(userId);
  if (!userHasValidContactForExpenses(owner)) {
    const err = new Error(CONTACT_FOR_EXPENSE_MSG);
    err.statusCode = 403;
    err.code = "CONTACT_INCOMPLETE";
    throw err;
  }
}
//  Create Expense
// export const createExpense = async (req, res) => {
//   try {
//     const user_id = req.user.id;

//     let {
//       title,
//       amount,
//       expense_date,
//       category,
//       currency = "INR",
//       payment_method = "cash",
//       notes = ""
//     } = req.body;

//     // ✅ VALIDATION
//     if (!title || !amount || !expense_date || !category) {
//       return res.status(400).json({
//         message: "Title, amount, date & category are required"
//       });
//     }

//     // ✅ SAFE NUMBER CONVERSION
//     const expenseAmount = Number(amount);
//     if (isNaN(expenseAmount) || expenseAmount <= 0) {
//       return res.status(400).json({
//         message: "Invalid amount"
//       });
//     }

//     // ✅ GET BUDGET
//     const budgetRows = await BudgetModel.getBudget(user_id);
//     const budget = Number(budgetRows?.[0]?.amount_limit) || 0;

//     // ✅ GET TOTAL SPENT
//     const [expenseRows] = await ExpenseModel.getAll(user_id);
//     const totalSpent = Number(expenseRows?.[0]?.total) || 0;

//     // ✅ CALCULATE NEW TOTAL
//     const newTotal = totalSpent + expenseAmount;

//     // ❌ BUDGET EXCEEDED CHECK
//     if (budget > 0 && newTotal > budget) {
//       return res.status(400).json({
//         message: "Budget exceeded ❌",
//         budget,
//         spent: totalSpent,
//         remaining: budget - totalSpent
//       });
//     }

//     // ⚠️ WARNINGS
//     let warning = null;
//     let warningType = null;

//     if (budget > 0) {
//       const percent = (newTotal / budget) * 100;

//       if (percent >= 90) {
//         warning = "🚨 90% budget used";
//         warningType = "danger";
//       } else if (percent >= 80) {
//         warning = "⚠️ 80% budget used";
//         warningType = "warning";
//       }
//     }

//     // ✅ CREATE EXPENSE
//     const result = await ExpenseModel.create({
//       user_id,
//       title,
//       amount: expenseAmount,
//       expense_date,
//       category,
//       currency,
//       payment_method,
//       notes
//     });

//     // ✅ FINAL VALUES
//     const remaining = budget - newTotal;
//     const usedPercent =
//       budget > 0 ? Number(((newTotal / budget) * 100).toFixed(2)) : 0;

//     // 🔥 SOCKET EMIT (VERY IMPORTANT FIX)
//     if (io) {
//       io.to(`userId:${user_id}`).emit("expenseUpdate", {
//         totalSpent: newTotal,
//         remaining,
//         usedPercent,
//         warning,
//         warningType
//       });
//     }

//     // ✅ RESPONSE
//     return res.status(201).json({
//       success: true,
//       message: "Expense created successfully 💰",
//       id: result.insertId,
//       warning,
//       data: {
//         totalSpent: newTotal,
//         remaining,
//         usedPercent
//       }
//     });

//   } catch (err) {
//     console.error("Create Expense Error:", err);

//     return res.status(500).json({
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

export const createExpense = async (req, res) => {
  try {
    const user_id = req.user?.id;

    let {
      title,
      amount,
      expense_date,
      category,
      currency = "INR",
      payment_method = "cash",
      notes = "",
      vendor = "",
      receipt_url = ""

    } = req.body;

    try {
      await assertUserMayWriteExpense(user_id);
    } catch (e) {
      if (e.statusCode === 403) {
        return res.status(403).json({
          message: e.message,
          code: e.code
        });
      }
      throw e;
    }

    // ✅ VALIDATION
    if (!title || !amount || !expense_date || !category) {
      return res.status(400).json({
        message: "Title, amount, date & category are required"
      });
    }

    // ✅ SAFE NUMBER CONVERSION
    const expenseAmount = Number(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    // ✅ GET BUDGET
    const budgetRows = await BudgetModel.getAllByUser(user_id);
    const budget = Number(budgetRows?.[0]?.amount_limit);
    console.log(budget);

    // ✅ GET TOTAL SPENT (FIXED BUG 🔥)
    const expenseData = await ExpenseModel.getAll(user_id);

    const expenseRows = Array.isArray(expenseData)
      ? expenseData[0] || []
      : [];

    const totalSpent = Number(expenseRows?.[0]?.totalExpense || 0);

    // ✅ CALCULATE NEW TOTAL
    const newTotal = totalSpent + expenseAmount;
    console.log(newTotal);

    // ❌ BUDGET EXCEEDED CHECK
    if (budget > 0 && newTotal > budget) {
      return res.status(400).json({
        message: "Budget exceeded ❌",
        budget,
        spent: totalSpent,
        remaining: budget - totalSpent
      });
    }

    // ⚠️ WARNINGS
    let warning = null;
    let warningType = null;

    if (budget > 0) {
      const percent = (newTotal / budget) * 100;
      console.log(percent)

      if (percent >= 90) {
        warning = "🚨 90% budget used";
        warningType = "danger";
      } else if (percent >= 80) {
        warning = "⚠️ 80% budget used";
        warningType = "warning";
      }
    }
    console.log("Vendor:", vendor);
console.log("Receipt URL:", receipt_url);
console.log("Full body:", req.body);

    // ✅ CREATE EXPENSE
    const result = await ExpenseModel.create({
      user_id,
      title,
      amount: expenseAmount,
      expense_date,
      category,
      currency,
      payment_method,
      notes,
      vendor,
      receipt_url
    });

    // ✅ FINAL VALUES
    const remaining = budget - newTotal;
    const usedPercent =
      budget > 0 ? Number(((newTotal / budget) * 100).toFixed(2)) : 0;

    // 🔥 SOCKET EMIT FIX
    if (typeof io !== "undefined") {
      io.to(`userId:${user_id}`).emit("expenseUpdate", {
        totalSpent: newTotal,
        remaining,
        usedPercent,
        warning,
        warningType
      });
    }

    // ✅ RESPONSE
    return res.status(201).json({
      success: true,
      message: "Expense created successfully 💰",
      id: result?.insertId || null,
      warning,
      data: {
        totalSpent: newTotal,
        remaining,
        usedPercent
      }
    });

  } catch (err) {
    console.error("Create Expense Error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
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
// export const updateExpense = async (req, res) => {
//   try {
//     const user_id = req.user.id;
//     const { id } = req.params;

//      console.log("Update body:", req.body);
//     const {
//       title,
//       amount,
//       expense_date,
//       category,
//       currency,
//       payment_method,
//       notes
//     } = req.body;

//     if (amount && amount <= 0) {
//       return res.status(400).json({
//         message: "Amount must be greater than 0"
//       });
//     }

//     const existing = await ExpenseModel.getById(id, user_id);

//     if (!existing) {
//       return res.status(404).json({ message: "Expense not found" });
//     }

//     // ✅ optional category check
//     if (category_id) {
//       const category = await pool.query(
//         "SELECT id FROM categories WHERE id=?",
//         [category_id]
//       );

//       if (category.length === 0) {
//         return res.status(400).json({
//           message: "Invalid category_id"
//         });
//       }
//     }

//     await ExpenseModel.update(id, user_id, {
//       title: title || existing.title,
//       amount: amount || existing.amount,
//       expense_date: expense_date || existing.expense_date,
//       category_id: category_id ?? existing.category_id,
//       currency: currency || existing.currency,
//       payment_method: payment_method || existing.payment_method,
//       notes: notes ?? existing.notes
//     });

//     res.json({ message: "Expense updated successfully" });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const updateExpense = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    console.log("Update body:", req.body);

    try {
      await assertUserMayWriteExpense(user_id);
    } catch (e) {
      if (e.statusCode === 403) {
        return res.status(403).json({
          message: e.message,
          code: e.code
        });
      }
      throw e;
    }

    const {
      title,
      amount,
      expense_date,
      category,        // ← category_id se category karo
      currency,
      payment_method,
      notes,
      vendor="",
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

    await ExpenseModel.update(id, user_id, {
      title: title || existing.title,
      amount: amount || existing.amount,
      expense_date: expense_date || existing.expense_date,
      category: category || existing.category,  // ← fix
      currency: currency || existing.currency,
      payment_method: payment_method || existing.payment_method,
      notes: notes ?? existing.notes,
      vendor: vendor || existing.vendor,
    });

    res.json({ message: "Expense updated successfully" });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Expense
export const deleteExpense = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const existing = await ExpenseModel.getById(id, user_id);
    console.log(existing);

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
    const { sort, category } = req.query;  // ✅ category add

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const expenses = await ExpenseModel.getAllExpenses(user_id, limit, offset, sort, category);

    // ✅ Total count 
    let countQuery = `SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?`;
    let countParams = [user_id];

    if (category) {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }

    const totalRows = await pool.query(countQuery, countParams);
    const total = totalRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      page, limit, total, totalPages,
      count: expenses.length,
      data: expenses
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;
    console.log("Message:", message);
    console.log("UserId:",userId);

    const budgetRows = await BudgetModel.getAllByUser(userId);
    const data = budgetRows[0];

    const expenses = await pool.query(
      `SELECT category, amount FROM expenses WHERE user_id = ?`,
      [userId]
    );

    if (!expenses.length) {
      return res.json({
        message: "No expenses found",
        summary: "Start adding expenses to get insights."
      });
    }

    const reply = await getInsights(message, data.amount_limit, expenses);

    return res.status(200).json({
      message: "summary generated successfully",
      summary: reply
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};

export const getUserCategories = async (req, res) => {
  try {
    const user_id = req.user.id;
    const rows = await pool.query(
      `SELECT DISTINCT category FROM expenses WHERE user_id = ? ORDER BY category`,
      [user_id]
    );
    const categories = rows.map((r) => r.category);
    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/** Category totals (all expenses) for dashboard charts. */
export const getCategorySummary = async (req, res) => {
  try {
    const user_id = req.user.id;
    const rows = await ExpenseModel.getAllCategorySummary(user_id);
    const list = Array.isArray(rows) ? rows : [];
    const items = list.map((r) => ({
      category: r.category,
      total: Number(r.total)
    }));
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
