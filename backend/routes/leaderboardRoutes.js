// routes/leaderboardRoutes.js
import { Router } from "express";
import { query } from "../db/index.js";

const r = Router();

r.get("/", async (req, res, next) => {
  try {
    const poolId = req.query.poolId || req.params.poolId;
    if (!poolId) return res.status(400).json({ error: "poolId required" });

    const { rows } = await query(
      `SELECT rank_in_pool AS rank, handle, initials, current_points
         FROM mm.vw_pool_leaderboard
        WHERE pool_id = $1
        ORDER BY rank_in_pool`,
      [poolId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

export default r;