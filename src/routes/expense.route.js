import { Router } from "express";
import { createExpense, deleteExpense,  getExpense,  getSummary, getTotalExpense, updateExpense , getAllExpenses, getExpenses } from "../controllers/expense.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";



const router = Router();

router.route("/").post( authMiddleware, createExpense);
router.route("/").get(authMiddleware , getAllExpenses);
router.route("/total").get( authMiddleware, getExpenses);
router.route("/:id").get( authMiddleware, getExpense);
router.route("/:id").put( authMiddleware, updateExpense);
router.route("/:id").delete( authMiddleware, deleteExpense);
router.route("/summary").get( authMiddleware, getSummary);


export default router;