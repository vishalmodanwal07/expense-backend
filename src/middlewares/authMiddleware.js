import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  try {

   const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.accessToken;
     if(!token){
      return res.status(401).json({ message: "No token provided" });
     }

    const decoded = jwt.verify(token, JWT_SECRET);

    const rawId = decoded?.id ?? decoded?.sub;
    req.user = {
      ...decoded,
      id: rawId != null && rawId !== "" ? String(rawId) : rawId
    };

    next();

  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};