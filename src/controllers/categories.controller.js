import { CategoryModel } from "../models/category.model.js";

export const getCategories = async (req, res) => {
  try {
    const data = await CategoryModel.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};