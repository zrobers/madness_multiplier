import { Router } from "express";
import leaderboard from "./leaderboardRoutes.js";

const r = Router();
r.use("/leaderboard", leaderboard);

// quick ping
r.get("/ping", (req, res) => res.json({ pong: true }));

export default r;