import {Router} from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {  getCategories } from "../controllers/categories.controllerss.js";

const router = Router();


router.route("/").get(authMiddleware , getCategories);


export default router;