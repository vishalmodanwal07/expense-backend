import { pool } from "../db/db.js";


export const CategoryModel = {
  getAll: async () => {
    return await pool.query("SELECT * FROM categories");
  }
};