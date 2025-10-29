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
        g.game_id,
        g.round_code,
        g.region,
        g.game_no,
        g.start_time_utc,
        g.status,
        g.score_a,
        g.score_b,
        g.winner_team_id,
        
        -- Team A
        g.team_a_id,
        ta.team_name AS team_a_name,
        g.team_a_seed,
        
        -- Team B
        g.team_b_id,
        tb.team_name AS team_b_name,
        g.team_b_seed,
        
        -- Winner info
        tw.team_name AS winner_name,
        
        -- Check if game is upcoming, live, or final
        CASE 
          WHEN g.start_time_utc > $2::timestamptz THEN 'UPCOMING'
          WHEN g.status = 'IN_PROGRESS' THEN 'LIVE'
          WHEN g.status = 'FINAL' THEN 'FINAL'
          WHEN g.status = 'SCHEDULED' AND g.start_time_utc <= $2::timestamptz THEN 'LIVE'
          ELSE 'FINAL'
        END AS game_state
        
      FROM mm.games g
      JOIN mm.teams ta ON ta.team_id = g.team_a_id
      JOIN mm.teams tb ON tb.team_id = g.team_b_id
      LEFT JOIN mm.teams tw ON tw.team_id = g.winner_team_id
      WHERE g.season_year = $1
      ORDER BY g.game_id ASC, g.start_time_utc ASC;
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

