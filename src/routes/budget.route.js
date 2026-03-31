import {Router} from "express";
import { deleteBudget, getBudgetByMonth, getBudgets, getBudgetSummary, setBudget } from "../controllers/budget.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/").post( authMiddleware, setBudget);
router.route("/").get( authMiddleware, getBudgets);
router.route("/month").get(authMiddleware, getBudgetByMonth);
router.route("/:id").delete( authMiddleware, deleteBudget);
router.route("/summary" , authMiddleware , getBudgetSummary);
export default router;