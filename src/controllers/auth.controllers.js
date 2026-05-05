import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { TokenModel } from "../models/token.model.js";
import { emailContent, passwordResetMailContent, sendEmail } from "../../utils/mail.js";
import {
  isValidEmailFormat,
  normalizeIndianMobile
} from "../../utils/contactValidation.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*!]{6,}$/;


export const signup = async (req, res) => {
  try {
    const { name, email, password, mobile, emailOtpToken, mobileOtpToken } =
      req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      mobile == null ||
      String(mobile).trim() === ""
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailOtpToken || !mobileOtpToken) {
      return res.status(400).json({
        message: "Verify your email and mobile with OTP before signing up."
      });
    }

    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const mobileNorm = normalizeIndianMobile(mobile);
    if (!mobileNorm) {
      return res.status(400).json({
        message: "Invalid mobile number. Use a 10-digit Indian number (starts with 6–9), optional +91."
      });
    }

    const emailLower = email.trim().toLowerCase();
    let emailClaim;
    let mobileClaim;
    try {
      emailClaim = jwt.verify(emailOtpToken, JWT_SECRET);
      mobileClaim = jwt.verify(mobileOtpToken, JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Verification expired. Resend OTP and verify again."
      });
    }

    if (
      emailClaim?.purpose !== "signup_email_verified" ||
      emailClaim?.email !== emailLower
    ) {
      return res.status(400).json({ message: "Email verification is invalid." });
    }

    if (
      mobileClaim?.purpose !== "signup_mobile_verified" ||
      mobileClaim?.mobile !== mobileNorm
    ) {
      return res.status(400).json({ message: "Mobile verification is invalid." });
    }

    const existing = await UserModel.findByEmail(email.trim());
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const mobileTaken = await UserModel.findByMobile(mobileNorm);
    if (mobileTaken) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: email.trim(),
      password,
      mobile: mobileNorm
    });

      await sendEmail({
      email: email.trim(),
      subject: "Welcome User",
      mailgenContent: emailContent(name.trim())
    });


    res.status(201).json({
      message: "User created",
      userId: user.insertId.toString()
    });
  } catch (err) {
    console.error(err);
    if (err?.errno === 1062 || err?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email or mobile already registered" });
    }
    res.status(500).json({ message: "failed to create user"});
  }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
     if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // if (!emailRegex.test(email)) {
    //   return res.status(400).json({ message: "Invalid email format" });
    // }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "user not exist" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const accessToken = jwt.sign(
      { id: user.id.toString() },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id.toString() },
      JWT_REFRESH_SECRET,
      { expiresIn: "10d" }
    );

    // 🔥 Step 1: delete old tokens
await TokenModel.deleteByUser(user.id);

// 🔥 Step 2: create new token
await TokenModel.create({
  user_id: user.id,
  token: refreshToken,
  expires_at: new Date(Date.now() + 10 * 24 * 3600 * 1000)
});

const userdetails = await UserModel.findById(user.id);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
      })
      .status(200)
      .json({
        message: "login successful",
        accessToken ,
        userdetails ,
      });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//  REFRESH TOKEN
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token please login" });
    }

    jwt.verify(token, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const stored = await TokenModel.findValidToken({
        user_id: decoded.id,
        token
      });

      if (!stored) {
        return res.status(403).json({ message: "Token expired or invalid" });
      }

      const accessToken = jwt.sign(
        { id: decoded.id.toString() },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// LOGOUT
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await TokenModel.deleteToken(token);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "strict"
    });

    res.json({ message: "logout successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user?.id)
    return res.status(200).json({
      user,
      message: "current user fetched successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong"
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, newPassword, mobile } = req.body || {};

    if (userId === undefined || userId === null || userId === "") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (mobile == null || String(mobile).trim() === "") {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const mobileNorm = normalizeIndianMobile(mobile);
    if (!mobileNorm) {
      return res.status(400).json({
        message: "Invalid mobile number. Use a 10-digit Indian number (starts with 6–9), optional +91."
      });
    }

    const otherWithMobile = await UserModel.findOtherUserByMobile(
      mobileNorm,
      userId
    );
    if (otherWithMobile) {
      return res.status(400).json({ message: "Mobile number already in use" });
    }

    const wantsPasswordChange =
      typeof newPassword === "string" && newPassword.trim().length > 0;

    if (wantsPasswordChange) {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters"
        });
      }

      const record = await UserModel.findByIdFull(userId);
      if (!record) {
        return res.status(404).json({ message: "User not found" });
      }

      const password_hash = await bcrypt.hash(newPassword.trim(), 10);
      await UserModel.updatePasswordHash(userId, password_hash);
    }

    await UserModel.updateName(userId, name.trim());
    await UserModel.updateMobile(userId, mobileNorm);
    const user = await UserModel.findById(userId);

    return res.status(200).json({
      user,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error(error);
    if (error?.errno === 1062 || error?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Mobile number already in use" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const passwordResetGenericResponse = () => ({
  message:
    "If an account exists for this email, you will receive password reset instructions shortly."
});

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserModel.findByEmail(email.trim());
    if (!user) {
      return res.status(200).json(passwordResetGenericResponse());
    }

    const resetToken = jwt.sign(
      { id: user.id.toString(), purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:4200";
    const resetLink = `${frontendBase.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendEmail({
      email: user.email,
      subject: "Reset your password",
      mailgenContent: passwordResetMailContent(user.name, resetLink)
    });

    return res.status(200).json(passwordResetGenericResponse());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({ message: "Reset token is required" });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token.trim(), JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Invalid or expired reset link. Please request a new one from the login page."
      });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const userId = decoded.id;
    const user = await UserModel.findByIdFull(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const password_hash = await bcrypt.hash(newPassword.trim(), 10);
    await UserModel.updatePasswordHash(userId, password_hash);
    await TokenModel.deleteByUser(userId);

    return res.status(200).json({
      message: "Password updated successfully. You can sign in with your new password."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};