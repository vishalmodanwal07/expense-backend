// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { BudgetModel } from "../src/models/budget.model.js";
// import { ExpenseModel } from "../src/models/expense.model.js";


// console.log(process.env.GEMINI_API_KEY);
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export const getInsights = async (message , budget , expenses ) => {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   // const budget = await BudgetModel.getBudget(req.user.id);
//   // const expenses = await ExpenseModel.getAllCategorySummary(req.user.id);


//     const prompt = `
// You are a smart personal finance assistant.

// User Monthly Budget: ₹${budget}

// Category-wise Spending:
// ${expenses.map(c => `${c.category}: ₹${c.total}`).join("\n")}

// All Expenses:
// ${JSON.stringify(expenses)}

// User Question:
// "${message}"

// Rules:
// - Answer in short (max 80 words)
// - Give practical tips
// - Highlight overspending if any
// - Be simple and clear

// `;

//   const result = await model.generateContent(prompt);
//   return result.response.text();
// }


import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getInsights = async (message, budget, expenses) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  // 👉 Category summary banana zaroori hai
  const categoryMap = {};

  expenses.forEach(e => {
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = 0;
    }
    categoryMap[e.category] += Number(e.amount);
  });

  const categorySummary = Object.entries(categoryMap).map(
    ([category, total]) => ({ category, total })
  );

  // 👉 Total spending
  const totalSpent = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const prompt = `
You are a smart personal finance assistant.

User Monthly Budget: ₹${budget}
Total Spent: ₹${totalSpent}

Category-wise Spending:
${categorySummary.map(c => `${c.category}: ₹${c.total}`).join("\n")}

User Question:
"${message}"

Rules:
- Answer in short (max 80 words)
- Give practical tips
- Highlight overspending
- Be simple and clear
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};