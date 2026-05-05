import { Router } from "express";
import { createExpense, deleteExpense,  getExpense,  getSummary, getTotalExpense, updateExpense , getAllExpenses, getExpenses,getUserCategories, getCategorySummary} from "../controllers/expense.controllers.js";
import { scanReceipt, upload } from '../controllers/receipt.controller.js';
import { authMiddleware } from "../middlewares/authMiddleware.js";


const router = Router();

router.route("/").post( authMiddleware, createExpense);
router.route("/").get(authMiddleware , getAllExpenses);
router.route("/total").get( authMiddleware, getExpenses);
router.route("/summary").get( authMiddleware, getSummary);
router.route("/user-categories").get(authMiddleware, getUserCategories);
router.route("/category-summary").get(authMiddleware, getCategorySummary);
router.route("/scan-receipt").post(authMiddleware, upload.single('receipt'), scanReceipt);
router.route("/:id").get( authMiddleware, getExpense);
router.route("/:id").put( authMiddleware, updateExpense);
router.route("/:id").delete( authMiddleware, deleteExpense);



export default router;