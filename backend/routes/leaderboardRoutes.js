import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const r = Router();
r.get("/:poolId?", getLeaderboard); // supports /api/leaderboard/:poolId or ?poolId=

export default r;