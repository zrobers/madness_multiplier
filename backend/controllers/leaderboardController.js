import { query } from "../db/index.js";

export async function getLeaderboard(req, res, next) {
  try {
    const poolId = req.query.poolId || req.params.poolId; // ✅ just assign
    if (!poolId) {
      return res.status(400).json({ error: "poolId required" });
    }

    // Cast poolId to UUID to ensure proper type matching
    const result = await query(
      `
      SELECT 
        lb.rank_in_pool AS rank,
        lb.handle,
        lb.initials,
        lb.current_points
      FROM mm.vw_pool_leaderboard lb
      WHERE lb.pool_id = $1::uuid
      ORDER BY lb.rank_in_pool ASC;
      `,
      [poolId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    next(err);
  }
}