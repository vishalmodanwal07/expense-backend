import { Router } from "express";
import { getCurrentUser, login, logout, refreshAccessToken, signup } from "../controllers/auth.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/signup").post(signup)
router.route("/login").post(login)
router.route("/logout").post(authMiddleware , logout)
router.route("/profile").get( authMiddleware, getCurrentUser);
router.route("/refresh").get(refreshAccessToken)


export default  router;