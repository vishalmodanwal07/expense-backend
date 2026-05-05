import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Expense Tracker",
    link: process.env.FRONTEND_URL || "http://localhost:4200"
  }
});

export function isMailConfigured() {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.EMAIL_PASS || "").trim();
  return Boolean(user && pass);
}

function buildTransporter() {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.EMAIL_PASS || "").trim();
  if (!user || !pass) {
    const err = new Error(
      "Email is not configured: set EMAIL_USER and EMAIL_PASS in the server .env (use a Gmail App Password if using Gmail)."
    );
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

/**
 * Sends mail. Swallows errors (legacy behaviour) — use for welcome / non-critical mail.
 */
const sendEmail = async (options) => {
  try {
    await sendEmailStrict(options);
  } catch (error) {
    console.error("email service failed", error?.message || error);
  }
};

/**
 * Sends mail and throws on failure so callers can return 503 to the client.
 */
const sendEmailStrict = async (options) => {
  const emailtext = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = buildTransporter();
  const fromAddr =
    process.env.EMAIL_FROM ||
    `"Expense Tracker" <${process.env.EMAIL_USER}>`;

  const mail = {
    from: fromAddr,
    to: options.email,
    subject: options.subject,
    text: emailtext,
    html: emailHtml
  };

  await transporter.sendMail(mail);
};

const emailContent = (username) => {
  return {
    body: {
      name: username,
      intro: `Welcome ${username} to our Expense Tracking App ! we are exicited to have 
        you on board`,
      action: {
        button: {
          color: "green",
          text: `Welcome ${username} , login link`,
          link: `${process.env.FRONTEND_URL || "http://localhost:4200"}/login`
        }
      }
    }
  };
};

const passwordResetMailContent = (username, resetLink) => ({
  body: {
    name: username,
    intro:
      "We received a request to reset the password for your Expense Tracker account.",
    action: {
      button: {
        color: "#2563eb",
        text: "Choose a new password",
        link: resetLink
      }
    },
    outro:
      "If you did not request a reset, you can ignore this email. The link expires in one hour."
  }
});

const signupEmailOtpContent = (code) => ({
  body: {
    name: "there",
    intro: `Your ExpenseTracker email verification code is: ${code}. It expires in 10 minutes.`,
    outro: "If you did not start creating an account, you can ignore this email."
  }
});

const signupMobileOtpEmailContent = (code, mobileDisplay) => ({
  body: {
    name: "there",
    intro: `Your mobile verification code for ${mobileDisplay} is: ${code}. Enter it on the signup form. Expires in 10 minutes.`,
    outro:
      "This code was sent to your email because SMS is not configured on this server."
  }
});

export {
  emailContent,
  passwordResetMailContent,
  sendEmail,
  sendEmailStrict,
  signupEmailOtpContent,
  signupMobileOtpEmailContent
};
