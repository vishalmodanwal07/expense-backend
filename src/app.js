import express from "express";
import {config} from "dotenv";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));



export default app;