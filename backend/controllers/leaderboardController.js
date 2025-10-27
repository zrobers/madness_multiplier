import { query } from "../db/index.js";

export async function getLeaderboard(req, res, next) {
  try {
    const poolId = req.query.poolId || req.params.poolId; // ✅ just assign
    if (!poolId) {
      return res.status(400).json({ error: "poolId required" });
    }

    const result = await query(
      `
      SELECT rank_in_pool AS rank, handle, initials, current_points
      FROM mm.vw_pool_leaderboard
      WHERE pool_id = $1
      ORDER BY rank_in_pool ASC;
      `,
      [poolId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    next(err);
  }
}