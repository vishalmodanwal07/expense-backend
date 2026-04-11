import { Router } from "express";
import { createExpense, deleteExpense, getExpense, getExpenses, getTotalExpense, updateExpense } from "../controllers/expense.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";



const router = Router();

router.route("/").post( authMiddleware, createExpense);
router.route("/").get( authMiddleware, getTotalExpense);
router.route("/:id").get( authMiddleware, getExpense);
router.route("/:id").put( authMiddleware, updateExpense);
router.route("/:id").delete( authMiddleware, deleteExpense);

export default router;