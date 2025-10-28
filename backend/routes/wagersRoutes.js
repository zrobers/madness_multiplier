// routes/wagers.routes.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db/index.js";

const r = Router();

// GET endpoint to fetch user's wagers
r.get("/", async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const poolId = req.query.poolId || 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';

    const result = await query(
      `SELECT 
        w.wager_id,
        w.pool_id,
        w.user_id,
        w.game_id,
        w.picked_team_id,
        w.picked_seed,
        w.opp_seed,
        w.stake_points,
        w.posted_odds,
        w.placed_at,
        w.status,
        w.payout_points,
        w.settled_at,
        g.team_a_id,
        g.team_b_id,
        g.team_a_seed,
        g.team_b_seed,
        g.status as game_status,
        g.winner_team_id,
        g.start_time_utc,
        g.round_code,
        ta.team_name as team_a_name,
        tb.team_name as team_b_name,
        tp.team_name as picked_team_name
      FROM mm.wagers w
      JOIN mm.games g ON w.game_id = g.game_id
      JOIN mm.teams ta ON g.team_a_id = ta.team_id
      JOIN mm.teams tb ON g.team_b_id = tb.team_id
      JOIN mm.teams tp ON w.picked_team_id = tp.team_id
      WHERE w.user_id = $1 AND w.pool_id = $2
      ORDER BY w.placed_at DESC`,
      [userId, poolId]
    );

    const wagers = result.rows.map(row => ({
      ...row,
      // Convert numeric strings to numbers for frontend
      stake_points: parseFloat(row.stake_points),
      posted_odds: parseFloat(row.posted_odds),
      payout_points: row.payout_points ? parseFloat(row.payout_points) : null,
      picked_team_name: row.picked_team_name,
      opponent_team_name: row.picked_team_id === row.team_a_id ? row.team_b_name : row.team_a_name,
      expected_payout: parseFloat(row.stake_points) * parseFloat(row.posted_odds)
    }));

    return res.json({ wagers });
  } catch (err) {
    console.error("GET wagers failed:", err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

const validators = [
  body("poolId")
    .isString()
    .trim()
    .matches(/^[0-9a-fA-F-]{36}$/)
    .withMessage("poolId must be a valid UUID"),
  body("gameId").isInt({ min: 1 }).withMessage("gameId positive int"),
  body("teamId").isInt({ min: 1 }).withMessage("teamId positive int"),
  body("amount").isFloat({ gt: 0 }).withMessage("amount > 0"),
];

r.post("/", validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // UUID, default to zach for testing
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const poolId = req.body.poolId;                 // UUID
  const gameId = Number(req.body.gameId);         // INT
  const pickedTeamId = Number(req.body.teamId);   // INT
  const stakePoints = Number(req.body.amount);    // map "amount" -> stake_points

  try {
    // Must be member of pool
    const mem = await query(
      `SELECT 1 FROM mm.pool_members WHERE pool_id=$1 AND user_id=$2 LIMIT 1`,
      [poolId, userId]
    );
    if (mem.rowCount === 0) return res.status(403).json({ error: "Not a member of this pool" });

    // Game context
    const gq = await query(
      `SELECT g.game_id, g.status, g.team_a_id, g.team_b_id,
              g.team_a_seed, g.team_b_seed, g.start_time_utc
         FROM mm.games g
         WHERE g.game_id=$1`,
      [gameId]
    );
    if (gq.rowCount === 0) return res.status(404).json({ error: "Game not found" });
    const g = gq.rows[0];
    
    // Check if wagering is locked (game must be SCHEDULED and not past tipoff)
    if (g.status !== "SCHEDULED") return res.status(400).json({ error: "Wagering closed - game has started or finished" });
    if (g.start_time_utc && new Date(g.start_time_utc) <= new Date()) {
      return res.status(400).json({ error: "Wagering closed - game has reached scheduled tipoff" });
    }
    
    if (pickedTeamId !== g.team_a_id && pickedTeamId !== g.team_b_id) {
      return res.status(400).json({ error: "Selected team not in this game" });
    }

    const pickedSeed = pickedTeamId === g.team_a_id ? g.team_a_seed : g.team_b_seed;
    const oppSeed = pickedTeamId === g.team_a_id ? g.team_b_seed : g.team_a_seed;

    // Calculate odds: M = clip(1 + seed_picked / seed_opponent, 1.1, 3.5)
    // Your multiplier is based on YOUR seed - picking favorite (seed 1) gives lower payout
    const rawOdds = 1.0 + (pickedSeed / oppSeed);
    const posted_odds = Math.max(1.1, Math.min(3.5, rawOdds)); // Clamp between 1.1 and 3.5

    // Check user balance (sum of all transactions for this pool)
    const bal = await query(
      `SELECT COALESCE(SUM(amount_points), 0) as balance 
       FROM mm.transactions 
       WHERE pool_id=$1 AND user_id=$2`,
      [poolId, userId]
    );
    const currentBalance = Number(bal.rows?.[0]?.balance ?? 0);
    if (currentBalance < stakePoints) return res.status(400).json({ error: "Insufficient points" });

    // Insert wager
    const ins = await query(
      `INSERT INTO mm.wagers
         (pool_id, user_id, game_id, picked_team_id, picked_seed, opp_seed, stake_points, posted_odds, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'OPEN')
       RETURNING wager_id`,
      [poolId, userId, gameId, pickedTeamId, pickedSeed, oppSeed, stakePoints, posted_odds]
    );
    const wagerId = ins.rows[0].wager_id;

    // Record the wager stake as a transaction (negative amount)
    await query(
      `INSERT INTO mm.transactions 
         (pool_id, user_id, tx_type, amount_points, wager_id, game_id, notes)
       VALUES ($1, $2, 'WAGER_STAKE', $3, $4, $5, $6)`,
      [poolId, userId, -stakePoints, wagerId, gameId, `Wager on game ${gameId}`]
    );

    const expected_payout = stakePoints * posted_odds;
    return res.status(201).json({
      wager: {
        wager_id: wagerId,
        pool_id: poolId,
        user_id: userId,
        game_id: gameId,
        picked_team_id: pickedTeamId,
        picked_seed: pickedSeed,
        opp_seed: oppSeed,
        stake_points: stakePoints,
        posted_odds,
        expected_payout,
        status: "PENDING",
      },
    });
  } catch (err) {
    try { await query("ROLLBACK"); } catch {}
    console.error("wagers POST failed:", err);
    return res.status(400).json({ error: String(err.message || err) });
  }
});

export default r;