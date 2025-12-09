import { query } from "../db/index.js";

async function findUserByHandle(handle) {
  if (!handle) throw new Error('handle required');
  const selRes = await query(`SELECT user_id, handle FROM mm.users WHERE handle = $1`, [handle]);
  if (!selRes.rows.length) return null;
  return { user_id: selRes.rows[0].user_id, handle: selRes.rows[0].handle };
}

export async function getUserPools(req, res) {
  try {
    // Get Firebase user ID from header
    const firebaseUserId = req.header("X-User-Id");
    if (!firebaseUserId) return res.status(401).json({ error: "Firebase user ID required" });

    // Look up user in database
    const userRecord = await query(
      `SELECT user_id FROM mm.users WHERE user_id = $1`,
      [firebaseUserId]
    );

    if (userRecord.rowCount === 0) {
      return res.json({ pools: [] });
    }

    const dbUserId = userRecord.rows[0].user_id;

    // Get pools the user is a member of
    const sql = `
      SELECT p.pool_id, p.name, p.season_year, p.initial_points, p.unbet_penalty_pct,
             p.allow_multi_bets, p.created_at,
             u.user_id AS owner_user_id, u.handle AS owner_handle, u.initials AS owner_initials
      FROM mm.pools p
      JOIN mm.users u ON u.user_id = p.owner_user_id
      JOIN mm.pool_members pm ON pm.pool_id = p.pool_id
      WHERE pm.user_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await query(sql, [dbUserId]);
    return res.json({ pools: result.rows });
  } catch (err) {
    console.error('getUserPools error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

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
    // pool + owner
    const poolSql = `
      SELECT p.*, u.handle AS owner_handle
      FROM mm.pools p
      JOIN mm.users u ON u.user_id = p.owner_user_id
      WHERE p.pool_id = $1
    `;
    const poolRes = await query(poolSql, [id]);
    if (!poolRes.rows.length) return res.status(404).json({ error: 'Pool not found' });
    const pool = poolRes.rows[0];

    // members
    const membersSql = `
      SELECT pm.user_id, u.handle, pm.joined_at
      FROM mm.pool_members pm
      JOIN mm.users u ON u.user_id = pm.user_id
      WHERE pm.pool_id = $1
      ORDER BY pm.joined_at ASC
    `;
    const membersRes = await query(membersSql, [id]);
    const members = membersRes.rows;

    // wagers for this pool, joined to user, game and team names
    const wagersSql = `
      SELECT
        w.wager_id,
        w.pool_id,
        w.user_id,
        u.handle,
        w.game_id,
        g.team_a_id,
        g.team_b_id,
        g.start_time_utc,
        w.picked_team_id,
        CASE
          WHEN w.picked_team_id = g.team_a_id THEN ta.team_name
          WHEN w.picked_team_id = g.team_b_id THEN tb.team_name
          ELSE NULL END AS picked_team_name,
        CASE
          WHEN w.picked_team_id = g.team_a_id THEN tb.team_name
          WHEN w.picked_team_id = g.team_b_id THEN ta.team_name
          ELSE NULL END AS opp_team_name,
        w.picked_seed,
        w.opp_seed,
        w.stake_points,
        w.posted_odds,
        w.placed_at,
        w.status,
        w.settled_at,
        w.payout_points
      FROM mm.wagers w
      JOIN mm.users u ON u.user_id = w.user_id
      JOIN mm.games g ON g.game_id = w.game_id
      LEFT JOIN mm.teams ta ON ta.team_id = g.team_a_id
      LEFT JOIN mm.teams tb ON tb.team_id = g.team_b_id
      WHERE w.pool_id = $1
      ORDER BY u.handle, w.placed_at ASC
    `;
    const wagersRes = await query(wagersSql, [id]);
    const wagers = wagersRes.rows;

    return res.json({ pool, members, wagers });
  } catch (err) {
    console.error('getPoolById error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createPool(req, res) {
  try {
    const { name, season_year, initial_points, unbet_penalty_pct, allow_multi_bets, owner_handle } = req.body;
    if (!name || !season_year || !owner_handle) {
      return res.status(400).json({ error: 'name, season_year and owner_handle are required' });
    }

    // Ensure the tournament (season) exists. Insert if missing.
    await query(
      `INSERT INTO mm.tournaments (season_year) VALUES ($1) ON CONFLICT DO NOTHING`,
      [season_year]
    );

    // Look up user by handle
    const owner = await findUserByHandle(owner_handle);
    if (!owner) {
      return res.status(400).json({ error: 'owner handle does not exist. Please sign up or choose an existing handle.' });
    }

    // Insert pool with the existing owner_user_id
    const sql = `
      INSERT INTO mm.pools (name, owner_user_id, season_year, initial_points, unbet_penalty_pct, allow_multi_bets)
      VALUES ($1, $2, $3, COALESCE($4,1000), COALESCE($5,20.00), COALESCE($6, TRUE))
      RETURNING pool_id, name, season_year, initial_points, unbet_penalty_pct, allow_multi_bets, created_at
    `;
    const params = [name, owner.user_id, season_year, initial_points, unbet_penalty_pct, allow_multi_bets];
    const insertRes = await query(sql, params);
    const pool = insertRes.rows[0];

    // add owner as member (owner must already be a user)
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
    console.log(handle);
    if (!handle) return res.status(400).json({ error: 'handle is required to join' });

    // ensure pool exists
    const poolCheck = await query(`SELECT pool_id FROM mm.pools WHERE pool_id = $1`, [id]);
    if (!poolCheck.rows.length) return res.status(404).json({ error: 'Pool not found' });

    // Require user exists
    const user = await findUserByHandle(handle);
    if (!user) {
      return res.status(400).json({ error: 'handle does not exist. Please sign up first.' });
    }

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

    // Allocate initial credits for the new pool member
    const poolQuery = await query(
      `SELECT initial_points FROM mm.pools WHERE pool_id = $1`,
      [id]
    );

    if (poolQuery.rows.length > 0) {
      const initialPoints = Number(poolQuery.rows[0].initial_points);

      // Give initial credits
      await query(
        `INSERT INTO mm.transactions (pool_id, user_id, tx_type, amount_points, notes)
         VALUES ($1, $2, 'INIT_CREDIT', $3, 'Initial pool credits')`,
        [id, user.user_id, initialPoints]
      );
    }

    return res.status(201).json({ message: 'Joined pool', pool_id: id, user_id: user.user_id });
  } catch (err) {
    console.error('joinPool error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}