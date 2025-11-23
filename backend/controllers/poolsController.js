import { query } from "../db/index.js";

export async function getAllPools(req, res) {
  try {
    const sql = `
      SELECT p.pool_id, p.name, p.season_year, p.initial_points, p.unbet_penalty_pct,
             p.allow_multi_bets, p.created_at,
             u.user_id AS owner_user_id, u.handle AS owner_handle,
             COALESCE(m.member_count,0) AS member_count
      FROM mm.pools p
      JOIN mm.users u ON u.user_id = p.owner_user_id
      LEFT JOIN (
        SELECT pool_id, COUNT(*)::int AS member_count FROM mm.pool_members GROUP BY pool_id
      ) m ON m.pool_id = p.pool_id
      ORDER BY p.created_at DESC
    `;
    const result = await query(sql);
    return res.json(result.rows);
  } catch (err) {
    console.error('getAllPools error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPoolById(req, res) {
  const { id } = req.params;
  try {
    const poolSql = `
      SELECT p.*, u.handle AS owner_handle
      FROM mm.pools p
      JOIN mm.users u ON u.user_id = p.owner_user_id
      WHERE p.pool_id = $1
    `;
    const poolRes = await query(poolSql, [id]);
    if (!poolRes.rows.length) return res.status(404).json({ error: 'Pool not found' });
    const pool = poolRes.rows[0];

    const membersSql = `
      SELECT pm.user_id, u.handle, pm.joined_at
      FROM mm.pool_members pm
      JOIN mm.users u ON u.user_id = pm.user_id
      WHERE pm.pool_id = $1
      ORDER BY pm.joined_at ASC
    `;
    const membersRes = await query(membersSql, [id]);

    return res.json({ pool, members: membersRes.rows });
  } catch (err) {
    console.error('getPoolById error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function findOrCreateUserByHandle(handle) {
  if (!handle) throw new Error('handle required');
  const selectSql = `SELECT user_id, handle FROM mm.users WHERE handle = $1`;
  const selRes = await query(selectSql, [handle]);
  if (selRes.rows.length) return { user_id: selRes.rows[0].user_id, handle: selRes.rows[0].handle, created: false };

  const insertSql = `INSERT INTO mm.users (handle) VALUES ($1) RETURNING user_id, handle`;
  const insRes = await query(insertSql, [handle]);
  return { user_id: insRes.rows[0].user_id, handle: insRes.rows[0].handle, created: true };
}

// inside controllers/poolsController.js (ESM)
// ... keep other imports and helper functions

export async function createPool(req, res) {
  try {
    const { name, season_year, initial_points, unbet_penalty_pct, allow_multi_bets, owner_handle } = req.body;
    if (!name || !season_year || !owner_handle) {
      return res.status(400).json({ error: 'name, season_year and owner_handle are required' });
    }

    // 1) Ensure the tournament (season) exists. Insert if missing.
    // mm.tournaments only needs season_year (created_at defaults to now)
    await query(
      `INSERT INTO mm.tournaments (season_year) VALUES ($1) ON CONFLICT DO NOTHING`,
      [season_year]
    );

    // 2) Ensure owner exists (create user row if needed)
    const owner = await findOrCreateUserByHandle(owner_handle);

    // 3) Insert pool
    const sql = `
      INSERT INTO mm.pools (name, owner_user_id, season_year, initial_points, unbet_penalty_pct, allow_multi_bets)
      VALUES ($1, $2, $3, COALESCE($4,1000), COALESCE($5,20.00), COALESCE($6, TRUE))
      RETURNING pool_id, name, season_year, initial_points, unbet_penalty_pct, allow_multi_bets, created_at
    `;
    const params = [name, owner.user_id, season_year, initial_points, unbet_penalty_pct, allow_multi_bets];
    const insertRes = await query(sql, params);
    const pool = insertRes.rows[0];

    // 4) Add owner as member (silently ignore if already)
    await query(
      `INSERT INTO mm.pool_members (pool_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [pool.pool_id, owner.user_id]
    );

    return res.status(201).json({ pool, owner_handle: owner.handle });
  } catch (err) {
    console.error('createPool error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


export async function joinPool(req, res) {
  try {
    const { id } = req.params; // pool_id
    const { handle } = req.body;
    if (!handle) return res.status(400).json({ error: 'handle is required to join' });

    const poolCheck = await query(`SELECT pool_id FROM mm.pools WHERE pool_id = $1`, [id]);
    if (!poolCheck.rows.length) return res.status(404).json({ error: 'Pool not found' });

    const user = await findOrCreateUserByHandle(handle);

    const insertSql = `
      INSERT INTO mm.pool_members (pool_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING pool_id, user_id, joined_at
    `;
    const insertRes = await query(insertSql, [id, user.user_id]);
    if (!insertRes.rows.length) {
      // already a member
      return res.json({ message: 'Already a member', pool_id: id, user_id: user.user_id });
    }

    return res.status(201).json({ message: 'Joined pool', pool_id: id, user_id: user.user_id });
  } catch (err) {
    console.error('joinPool error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}