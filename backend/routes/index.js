import { Router } from "express";
import leaderboard from "./leaderboardRoutes.js";
import poolsRoutes from "./poolsRoutes.js";

const r = Router();
r.use("/leaderboard", leaderboard);
r.use("/pools", poolsRoutes)

// quick ping
r.get("/ping", (req, res) => res.json({ pong: true }));

export default r;

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));