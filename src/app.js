import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js"
import expenseRoutes from "./routes/expense.route.js"
import budgetRoutes from "./routes/budget.route.js"
import categoryRoutes from "./routes/category.route.js"
import uploadRoutes from "./routes/upload.route.js"
const app = express();

app.use(cors({
  origin : "*" ,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended: true , limit: "16kb"}));



app.get('/api/v1/health', (req, res) => {
   res.status(200).json({
    data : "hello"
   })
});
app.use((req, res , next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/expense" , expenseRoutes);
app.use("/api/v1/budget" , budgetRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/upload" , uploadRoutes)


export default app;