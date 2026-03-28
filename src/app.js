import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js"


const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());


// app.get('/api/v1/health', (req, res) => {
//    res.status(200).json({
//     data : "hello"
//    })
// });

app.use("/api/v1/auth", authRoutes);


export default app;