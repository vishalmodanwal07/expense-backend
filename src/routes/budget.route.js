import {Router} from "express";
import {  getBudget, getBudgetByMonth,  getBudgetSummary, getCurrentMonthBudget, setBudget, updateCurrentMonthBudget } from "../controllers/budget.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/").post( authMiddleware, setBudget);
router.route("/").get( authMiddleware, getCurrentMonthBudget);
router.route("/month").get(authMiddleware, getBudget);
router.route("/summary").get(authMiddleware , getBudgetSummary);
router.route("/").patch(authMiddleware , updateCurrentMonthBudget)
export default router;