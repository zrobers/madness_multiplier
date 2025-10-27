import db from "../db.js";

export async function getLeaderboard(req, res, next) {
  try {
    const { poolId } = req.params;
    const result = await db.query(
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
    next(err);
  }
}
