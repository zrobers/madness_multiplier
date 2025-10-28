import { query } from "../db/index.js";

export async function getGames(req, res, next) {
  try {
    const poolId = req.query.poolId;
    const season = req.query.season || 2024;

    // Hardcoded current time - simulating we're during the tournament
    // Set this to a time during first round games
    const CURRENT_TIME = new Date('2024-03-23T12:00:00Z'); // 8 AM ET on March 23, 2024 - right after Round of 64
    
    const result = await query(
      `
      SELECT 
        g.id AS game_id,
        g.round AS round_code,
        NULL AS region,
        NULL AS game_no,
        g.start_time AS start_time_utc,
        g.status,
        NULL AS score_a,
        NULL AS score_b,
        g.winner_team_id,
        
        -- Home Team (Team A)
        g.home_team_id AS team_a_id,
        ht.name AS team_a_name,
        ht.seed AS team_a_seed,
        
        -- Away Team (Team B)
        g.away_team_id AS team_b_id,
        at.name AS team_b_name,
        at.seed AS team_b_seed,
        
        -- Winner info
        wt.name AS winner_name,
        
        -- Check if game is upcoming, live, or final
        CASE 
          WHEN g.start_time > $2::timestamptz THEN 'UPCOMING'
          WHEN g.status = 'IN_PROGRESS' THEN 'LIVE'
          WHEN g.status = 'FINAL' THEN 'FINAL'
          WHEN g.status = 'SCHEDULED' AND g.start_time <= $2::timestamptz THEN 'LIVE'
          ELSE 'FINAL'
        END AS game_state
        
      FROM mm.games g
      JOIN mm.teams ht ON ht.id = g.home_team_id
      JOIN mm.teams at ON at.id = g.away_team_id
      LEFT JOIN mm.teams wt ON wt.id = g.winner_team_id
      WHERE ht.season = $1
      ORDER BY g.id ASC, g.start_time ASC;
      `,
      [season, CURRENT_TIME.toISOString()]
    );

    res.json({
      current_time: CURRENT_TIME,
      games: result.rows
    });
  } catch (err) {
    console.error("Error fetching games:", err);
    next(err);
  }
}

