import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  requestPasswordReset,
  resetPasswordWithToken,
  signup,
  updateProfile
} from "../controllers/auth.controllers.js";
import {
  sendSignupEmailOtp,
  sendSignupMobileOtp,
  verifySignupEmailOtp,
  verifySignupMobileOtp
} from "../controllers/signupOtp.controllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/signup/email-otp/send").post(sendSignupEmailOtp);
router.route("/signup/email-otp/verify").post(verifySignupEmailOtp);
router.route("/signup/mobile-otp/send").post(sendSignupMobileOtp);
router.route("/signup/mobile-otp/verify").post(verifySignupMobileOtp);
router.route("/signup").post(signup)
router.route("/login").post(login)
router.route("/forgot-password").post(requestPasswordReset)
router.route("/reset-password").post(resetPasswordWithToken)
router.route("/logout").post(authMiddleware , logout)
router
  .route("/profile")
  .get(authMiddleware, getCurrentUser)
  .patch(authMiddleware, updateProfile);
router.route("/refresh").get(refreshAccessToken)


export default  router;