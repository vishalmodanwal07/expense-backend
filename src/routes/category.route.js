import {Router} from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {  getCategories } from "../controllers/categories.controller.js";

const router = Router();


router.route("/").get(authMiddleware , getCategories);


export default router;