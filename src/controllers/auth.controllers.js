import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { TokenModel } from "../models/token.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;


export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await UserModel.create({ name, email, password });

    res.status(201).json({
      message: "User created",
      userId: user.insertId.toString()
    });

  } catch (err) {
    res.status(500).json({ message: "failed to create user" });
  }
};


// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id.toString() },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // store refresh token in DB
    await TokenModel.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000)
    });

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict"
      })
      .status(200)
      .json({
        message: "login successful",
        accessToken
      });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ REFRESH TOKEN
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
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


// ✅ LOGOUT
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