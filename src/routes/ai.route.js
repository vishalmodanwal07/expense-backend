import { Router } from "express";
import { getSummary } from "../controllers/expense.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";


const router = Router();

router.route("/").get(authMiddleware, getSummary);






export default  router;