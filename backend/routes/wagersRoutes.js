// routes/wagers.routes.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db/index.js";

const r = Router();

const validators = [
  body("poolId")
    .isInt({ min: 1 })
    .withMessage("poolId must be a positive integer"),
  body("gameId").isInt({ min: 1 }).withMessage("gameId positive int"),
  body("teamId").isInt({ min: 1 }).withMessage("teamId positive int"),
  body("amount").isFloat({ gt: 0 }).withMessage("amount > 0"),
];

r.post("/", validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = parseInt(req.user?.id) || 1; // Convert to integer, default to user 1 for testing
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const poolId = Number(req.body.poolId);         // INT
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
      `SELECT g.id, g.status, g.home_team_id, g.away_team_id,
              ht.seed as home_seed, at.seed as away_seed
         FROM mm.games g
         JOIN mm.teams ht ON ht.id = g.home_team_id
         JOIN mm.teams at ON at.id = g.away_team_id
         WHERE g.id=$1`,
      [gameId]
    );
    if (gq.rowCount === 0) return res.status(404).json({ error: "Game not found" });
    const g = gq.rows[0];
    if (g.status !== "SCHEDULED") return res.status(400).json({ error: "Wagering closed" });
    if (pickedTeamId !== g.home_team_id && pickedTeamId !== g.away_team_id) {
      return res.status(400).json({ error: "Selected team not in this game" });
    }

    const pickedSeed = pickedTeamId === g.home_team_id ? g.home_seed : g.away_seed;
    const oppSeed = pickedTeamId === g.home_team_id ? g.away_seed : g.home_seed;

    // Calculate odds based on seed difference
    const posted_odds = 1.0 + (pickedSeed / oppSeed);

    // Check user balance
    const bal = await query(
      `SELECT balance FROM mm.users WHERE id=$1`,
      [userId]
    );
    const currentBalance = Number(bal.rows?.[0]?.balance ?? 0);
    if (currentBalance < stakePoints) return res.status(400).json({ error: "Insufficient points" });

    // Insert wager
    const ins = await query(
      `INSERT INTO mm.wagers
         (pool_id, user_id, game_id, team_id, amount, odds, expected_payout, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING')
       RETURNING id`,
      [poolId, userId, gameId, pickedTeamId, stakePoints, posted_odds, stakePoints * posted_odds]
    );
    const wagerId = ins.rows[0].id;

    // Update user balance
    await query(
      `UPDATE mm.users SET balance = balance - $1 WHERE id = $2`,
      [stakePoints, userId]
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