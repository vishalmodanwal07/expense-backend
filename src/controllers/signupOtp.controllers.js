import jwt from "jsonwebtoken";
import {
  isValidEmailFormat,
  normalizeIndianMobile
} from "../../utils/contactValidation.js";
import {
  isMailConfigured,
  sendEmailStrict,
  signupEmailOtpContent,
  signupMobileOtpEmailContent
} from "../../utils/mail.js";
import { createAndStoreOtp, consumeOtp } from "../services/signupOtp.store.js";

const JWT_SECRET = process.env.JWT_SECRET;

const lastSent = new Map();
const SEND_COOLDOWN_MS = 45 * 1000;

function isInSendCooldown(key) {
  const t = lastSent.get(key) || 0;
  return Date.now() - t < SEND_COOLDOWN_MS;
}

function markSendSuccess(key) {
  lastSent.set(key, Date.now());
}

/** Human hint when Nodemailer / Gmail rejects the send */
function smtpFailureHint(err) {
  const blob = `${err?.message || ""} ${err?.response || ""} ${err?.responseCode || ""}`;
  if (/535|Invalid login|EAUTH|authentication failed|535-5\.7\.8/i.test(blob)) {
    return "Gmail: use an App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal password. Set EMAIL_USER to your Gmail address and EMAIL_PASS to that 16-character app password.";
  }
  return null;
}

/** When OTP_DEV_DISPLAY=1, skip SMTP and return the code in the API (local testing only). */
function otpDevModeEnabled() {
  return String(process.env.OTP_DEV_DISPLAY || "").trim() === "1";
}

/** Local / non-production: allow OTP without Gmail when SMTP env vars are missing. */
function allowOtpWithoutSmtp() {
  return process.env.NODE_ENV !== "production";
}

function issueEmailVerifiedToken(email) {
  const e = email.trim().toLowerCase();
  return jwt.sign(
    { purpose: "signup_email_verified", email: e },
    JWT_SECRET,
    { expiresIn: "20m" }
  );
}

function issueMobileVerifiedToken(mobileNorm) {
  return jwt.sign(
    { purpose: "signup_mobile_verified", mobile: mobileNorm },
    JWT_SECRET,
    { expiresIn: "20m" }
  );
}

export const sendSignupEmailOtp = async (req, res) => {
  try {
    const raw = req.body?.email;
    const email = raw != null ? String(raw).trim() : "";
    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    const key = `em:${email.toLowerCase()}`;
    if (isInSendCooldown(key)) {
      return res.status(429).json({
        message: "Please wait about a minute before requesting another code."
      });
    }

    const code = createAndStoreOtp(key);
    if (process.env.LOG_SIGNUP_OTP === "1") {
      console.info(`[signup-otp] email=${email} code=${code}`);
    }

    if (otpDevModeEnabled()) {
      markSendSuccess(key);
      return res.status(200).json({
        message:
          "Dev mode: email is not sent. Use the code below, then remove OTP_DEV_DISPLAY for production.",
        devOtp: code
      });
    }

    if (!isMailConfigured()) {
      if (!allowOtpWithoutSmtp()) {
        return res.status(503).json({
          message:
            "Email is not configured: set EMAIL_USER and EMAIL_PASS in the server .env (use a Gmail App Password if using Gmail).",
          code: "MAIL_NOT_CONFIGURED"
        });
      }
      markSendSuccess(key);
      return res.status(200).json({
        message:
          "No EMAIL_USER / EMAIL_PASS in .env — showing a dev OTP below. Add Gmail App Password credentials to send real email.",
        devOtp: code,
        devFallback: true
      });
    }

    await sendEmailStrict({
      email,
      subject: "Your ExpenseTracker email verification code",
      mailgenContent: signupEmailOtpContent(code)
    });

    markSendSuccess(key);
    return res.status(200).json({
      message: "Verification code sent to your email."
    });
  } catch (err) {
    console.error("sendSignupEmailOtp:", err?.message || err);
    const hint = smtpFailureHint(err);
    const msg =
      err?.code === "MAIL_NOT_CONFIGURED"
        ? err.message
        : err?.message ||
          "Could not send email. Check EMAIL_USER / EMAIL_PASS in .env (Gmail needs an App Password).";
    return res.status(503).json({
      message: msg,
      hint: hint || undefined,
      code: err?.code || "MAIL_SEND_FAILED"
    });
  }
};

export const verifySignupEmailOtp = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!code || String(code).trim().length < 4) {
      return res.status(400).json({ message: "Enter the verification code" });
    }

    const key = `em:${email.trim().toLowerCase()}`;
    if (!consumeOtp(key, String(code))) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const token = issueEmailVerifiedToken(email);
    return res.status(200).json({
      message: "Email verified",
      verificationToken: token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

export const sendSignupMobileOtp = async (req, res) => {
  try {
    const { mobile, email } = req.body || {};
    if (!email || !isValidEmailFormat(email)) {
      return res
        .status(400)
        .json({ message: "Enter a valid email first (code is sent there)." });
    }
    const mobileNorm = normalizeIndianMobile(mobile);
    if (!mobileNorm) {
      return res.status(400).json({
        message:
          "Invalid mobile. Use a 10-digit Indian number (starts with 6–9), optional +91."
      });
    }

    const key = `mb:${mobileNorm}`;
    if (isInSendCooldown(key)) {
      return res.status(429).json({
        message: "Please wait about a minute before requesting another code."
      });
    }

    const code = createAndStoreOtp(key);
    if (process.env.LOG_SIGNUP_OTP === "1") {
      console.info(`[signup-otp] mobile=${mobileNorm} emailTo=${email.trim()} code=${code}`);
    }

    if (otpDevModeEnabled()) {
      markSendSuccess(key);
      return res.status(200).json({
        message:
          "Dev mode: email is not sent. Use the code below, then remove OTP_DEV_DISPLAY for production.",
        devOtp: code
      });
    }

    if (!isMailConfigured()) {
      if (!allowOtpWithoutSmtp()) {
        return res.status(503).json({
          message:
            "Email is not configured: set EMAIL_USER and EMAIL_PASS in the server .env (use a Gmail App Password if using Gmail).",
          code: "MAIL_NOT_CONFIGURED"
        });
      }
      markSendSuccess(key);
      return res.status(200).json({
        message:
          "No EMAIL_USER / EMAIL_PASS in .env — showing a dev OTP below. Add Gmail App Password credentials to send real email.",
        devOtp: code,
        devFallback: true
      });
    }

    await sendEmailStrict({
      email: email.trim(),
      subject: "Your ExpenseTracker mobile verification code",
      mailgenContent: signupMobileOtpEmailContent(code, mobileNorm)
    });

    markSendSuccess(key);
    return res.status(200).json({
      message: "Mobile verification code sent to your email."
    });
  } catch (err) {
    console.error("sendSignupMobileOtp:", err?.message || err);
    const hint = smtpFailureHint(err);
    const msg =
      err?.code === "MAIL_NOT_CONFIGURED"
        ? err.message
        : err?.message ||
          "Could not send email. Check EMAIL_USER / EMAIL_PASS in .env (Gmail needs an App Password).";
    return res.status(503).json({
      message: msg,
      hint: hint || undefined,
      code: err?.code || "MAIL_SEND_FAILED"
    });
  }
};

export const verifySignupMobileOtp = async (req, res) => {
  try {
    const { mobile, code } = req.body || {};
    const mobileNorm = normalizeIndianMobile(mobile);
    if (!mobileNorm) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }
    if (!code || String(code).trim().length < 4) {
      return res.status(400).json({ message: "Enter the verification code" });
    }

    const key = `mb:${mobileNorm}`;
    if (!consumeOtp(key, String(code))) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const token = issueMobileVerifiedToken(mobileNorm);
    return res.status(200).json({
      message: "Mobile verified",
      verificationToken: token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Verification failed" });
  }
};
