import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { TokenModel } from "../models/token.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const AuthController = {
  signup: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(400).json({ message: "Email already registered" });

      const user = await UserModel.create({ name, email, password });
      res.json({ message: "User created", userId: user.insertId });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(400).json({ message: "Invalid credentials" });

      const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "15m" });
      const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

      // Store hashed refresh token
      await TokenModel.create({ user_id: user.id, token: refreshToken, expires_at: new Date(Date.now()+7*24*3600*1000) });

      res.json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(401).json({ message: "No token provided" });

      jwt.verify(token, JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid refresh token" });

        const stored = await TokenModel.findValidToken({ user_id: decoded.id, token });
        if (!stored) return res.status(403).json({ message: "Token expired or invalid" });

        const accessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: "15m" });
        res.json({ accessToken });
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};