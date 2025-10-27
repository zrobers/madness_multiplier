import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query, withClient } from './db.js';
import { computeOdds } from './odds.js';

const router = Router();

const validators = [
  body('poolId').isInt({ min: 1 }),
  body('gameId').isInt({ min: 1 }),
  body('teamId').isInt({ min: 1 }),
  body('amount').isFloat({ gt: 0 })
];

router.post('/', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id; // set by dev auth middleware
  const { poolId, gameId, teamId } = req.body;
  const amount = Number(req.body.amount);
  const idemKey = req.header('Idempotency-Key') || uuidv4();

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');

      // 1) Idempotency
      const idem = await client.query(
        'SELECT * FROM wagers WHERE idempotency_key = $1 LIMIT 1', [idemKey]
      );
      if (idem.rows.length) { await client.query('ROLLBACK'); return { wager: idem.rows[0], idempotent: true }; }

      // 2) Pool membership
      const mem = await client.query(
        'SELECT 1 FROM pool_members WHERE user_id = $1 AND pool_id = $2', [userId, poolId]
      );
      if (!mem.rows.length) throw new Error('Not a member of this pool');

      // 3) Game + seed context
      const gr = await client.query(
        `SELECT g.id, g.status, g.home_team_id, g.away_team_id,
                t1.seed AS home_seed, t2.seed AS away_seed
           FROM games g
           JOIN teams t1 ON t1.id = g.home_team_id
           JOIN teams t2 ON t2.id = g.away_team_id
          WHERE g.id = $1`, [gameId]
      );
      if (!gr.rows.length) throw new Error('Game not found');
      const g = gr.rows[0];
      if (g.status !== 'SCHEDULED') throw new Error('Wagering closed for this game');
      if (![g.home_team_id, g.away_team_id].includes(Number(teamId))) throw new Error('Selected team is not in this game');

      const oppSeed = (teamId === g.home_team_id) ? g.away_seed : g.home_seed;
      const mySeed  = (teamId === g.home_team_id) ? g.home_seed : g.away_seed;
      const odds = computeOdds(mySeed, oppSeed);
      const expectedPayout = amount * odds;

      // 4) Balance lock & debit
      const bal = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
      if (!bal.rows.length) throw new Error('User not found');
      if (Number(bal.rows[0].balance) < amount) throw new Error('Insufficient balance');

      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, userId]);

      // 5) Insert wager
      const ins = await client.query(
        `INSERT INTO wagers (user_id, pool_id, game_id, team_id, amount, odds, expected_payout, status, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING',$8)
         RETURNING *`,
        [userId, poolId, gameId, teamId, amount, odds, expectedPayout, idemKey]
      );

      await client.query('COMMIT');
      return { wager: ins.rows[0], expectedPayout };
    });

    return res.status(result.idempotent ? 200 : 201).json(result);
  } catch (err) {
    try { await query('ROLLBACK'); } catch {}
    return res.status(400).json({ error: String(err.message || err) });
  }
});

export default router;
