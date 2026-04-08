import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { TokenModel } from "../models/token.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*!]{6,}$/;


export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

     if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //  if (!emailRegex.test(email)) {
    //   return res.status(400).json({ message: "Invalid email format" });
    // }

    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({
    //     message:
    //       "Password must be at least 6 characters and contain at least 1 letter and 1 number"
    //   });
    // }

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

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
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