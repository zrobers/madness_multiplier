// routes/wagers.routes.js
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { query } from "../db/index.js";

const r = Router();

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

  const userId = req.user?.id; // UUID set by DEV shim
  if (!userId) return res.status(401).json({ error: "Unauthenticated" });

  const poolId = req.body.poolId;                 // UUID
  const gameId = String(req.body.gameId);         // BIGINT acceptable as string
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
      `SELECT game_id, round_code, status,
              team_a_id, team_b_id, team_a_seed, team_b_seed
         FROM mm.games WHERE game_id=$1`,
      [gameId]
    );
    if (gq.rowCount === 0) return res.status(404).json({ error: "Game not found" });
    const g = gq.rows[0];
    if (g.status !== "SCHEDULED") return res.status(400).json({ error: "Wagering closed" });
    if (pickedTeamId !== g.team_a_id && pickedTeamId !== g.team_b_id) {
      return res.status(400).json({ error: "Selected team not in this game" });
    }

    const pickedSeed = pickedTeamId === g.team_a_id ? g.team_a_seed : g.team_b_seed;
    const oppSeed    = pickedTeamId === g.team_a_id ? g.team_b_seed : g.team_a_seed;

    // Odds from DB
    const { rows: oddsRows } = await query(
      `SELECT mm.fn_seed_odds($1,$2) AS posted_odds`,
      [pickedSeed, oppSeed]
    );
    const posted_odds = Number(oddsRows[0].posted_odds);

    // Optional soft balance check
    const bal = await query(
      `SELECT current_points FROM mm.vw_pool_balances WHERE pool_id=$1 AND user_id=$2`,
      [poolId, userId]
    );
    const currentPoints = Number(bal.rows?.[0]?.current_points ?? 0);
    if (currentPoints < stakePoints) return res.status(400).json({ error: "Insufficient points" });

    // Transaction: insert wager + debit ledger
    await query("BEGIN");
    const ins = await query(
      `INSERT INTO mm.wagers
         (pool_id, user_id, game_id, picked_team_id, picked_seed, opp_seed,
          stake_points, posted_odds)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING wager_id`,
      [poolId, userId, gameId, pickedTeamId, pickedSeed, oppSeed, stakePoints, posted_odds]
    );
    const wagerId = ins.rows[0].wager_id;

    await query(
      `INSERT INTO mm.transactions
         (pool_id, user_id, round_code, tx_type, amount_points, wager_id, game_id, notes)
       VALUES ($1,$2,$3,'WAGER_STAKE',$4,$5,$6,'Stake placed')`,
      [poolId, userId, g.round_code ?? 1, -stakePoints, wagerId, gameId]
    );
    await query("COMMIT");

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
        status: "OPEN",
      },
    });
  } catch (err) {
    try { await query("ROLLBACK"); } catch {}
    console.error("wagers POST failed:", err);
    return res.status(400).json({ error: String(err.message || err) });
  }
});

export default r;