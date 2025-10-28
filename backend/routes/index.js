import { Router } from "express";
import leaderboard from "./leaderboardRoutes.js";
import poolsRoutes from "./poolsRoutes.js";

const r = Router();
r.use("/leaderboard", leaderboard);
r.use("/pools", poolsRoutes)

// quick ping
r.get("/ping", (req, res) => res.json({ pong: true }));

export default r;