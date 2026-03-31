import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js"
import expenseRoutes from "./routes/expense.route.js"
import budgetRoutes from "./routes/budget.route.js"
import categoryRoutes from "./routes/category.route.js"

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());


// app.get('/api/v1/health', (req, res) => {
//    res.status(200).json({
//     data : "hello"
//    })
// });
app.use((req, res , next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/expense" , expenseRoutes);
app.use("/api/v1/budget" , budgetRoutes);
app.use("/api/v1/categories", categoryRoutes);

export default app;