import { query } from "../db/index.js";

export async function getLeaderboard(req, res, next) {
  try {
    const poolId = req.query.poolId || req.params.poolId; // ✅ just assign
    if (!poolId) {
      return res.status(400).json({ error: "poolId required" });
    }

    const result = await query(
      `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY u.balance DESC) AS rank,
        u.username AS handle,
        LEFT(u.username, 3) AS initials,
        u.balance AS current_points
      FROM mm.users u
      JOIN mm.pool_members pm ON pm.user_id = u.id
      WHERE pm.pool_id = $1
      ORDER BY u.balance DESC;
      `,
      [poolId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    next(err);
  }
}