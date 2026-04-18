import {DyanamicTool} from "langchain/tools";
import { ExpenseModel } from "../src/models/expense.model";

export const getTotalExpenseTool = new DynamicTool({
  name: "get_total_expense",
  description: "Get total expense of user",
  func: async ({ user_id }) => {
    const [rows] = await ExpenseModel.getAll(user_id);
    return JSON.stringify(rows);
  }
});