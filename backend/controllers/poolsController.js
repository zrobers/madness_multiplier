// Controller-layer functions for Pools endpoints.

import { query } from "../db/index.js";

/**
 * Return a list of pools with basic metadata (owner handle, member_count).
 * Keeps the SQL here so tests can call the function without Express.
 */
export async function getAllPools(reqOrOpts = {}) {
  const sql = `
    SELECT
      p.pool_id,
      p.name,
      NULL AS owner_user_id,
      'Admin' AS owner_handle,
      2024 AS season_year,
      1000 AS initial_points,
      20.0 AS unbet_penalty_pct,
      true AS allow_multi_bets,
      NOW() AS created_at,
      COALESCE(pm.member_count, 0) AS member_count
    FROM mm.pools p
    LEFT JOIN (
      SELECT pool_id, COUNT(*) AS member_count
      FROM mm.pool_members
      GROUP BY pool_id
    ) pm ON pm.pool_id = p.pool_id
    ORDER BY p.pool_id DESC
    LIMIT 500;
  `;

  const result = await query(sql);
  return result.rows;
}

/**
 * Return a single pool by id, plus a list of members.
 * Throws an Error with 'not-found' code when missing.
 */
export async function getPoolById(poolId) {
  // Basic validation: ensure poolId looks like a UUID (simple check)
  if (!poolId || typeof poolId !== "string" || !/^[0-9a-fA-F-]{36}$/.test(poolId)) {
    const err = new Error("Invalid pool id");
    err.code = "invalid-id";
    throw err;
  }

  const poolSql = `
    SELECT p.pool_id,
           p.name,
           p.owner_user_id,
           u.handle AS owner_handle,
           p.season_year,
           p.initial_points,
           p.unbet_penalty_pct,
           p.allow_multi_bets,
           p.created_at
    FROM mm.pools p
    JOIN mm.users u ON u.user_id = p.owner_user_id
    WHERE p.pool_id = $1
    LIMIT 1;
  `;

  const membersSql = `
    SELECT pm.user_id, u.handle, u.initials, pm.joined_at
    FROM mm.pool_members pm
    JOIN mm.users u ON u.user_id = pm.user_id
    WHERE pm.pool_id = $1
    ORDER BY pm.joined_at ASC;
  `;

  const poolRes = await query(poolSql, [poolId]);
  if (!poolRes.rows.length) {
    const err = new Error("Pool not found");
    err.code = "not-found";
    throw err;
  }

  const membersRes = await query(membersSql, [poolId]);
  const pool = poolRes.rows[0];
  // attach members as an array (empty if none)
  pool.members = membersRes.rows || [];

  return pool;
}