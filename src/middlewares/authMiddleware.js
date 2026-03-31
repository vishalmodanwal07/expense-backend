import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  try {

   const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.accessToken;
     if(!token){
      return res.status(401).json({ message: "No token provided" });
     }

    const decoded = jwt.verify(token, JWT_SECRET);


    req.user = decoded; // { id: "userId" }

    next();

  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};