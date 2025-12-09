import { query } from "../db/index.js";
import { getCurrentTime } from "../utils/simulatedTime.js";

export async function getGames(req, res, next) {
  try {
    const poolId = req.query.poolId;
    const season = req.query.season || 2024;

    // Use simulated current time - simulating we're during the tournament
    // Set this to be after Round of 64 (March 20-21) and before Round of 32 (March 22-23)
    // March 22, 2025 at midnight UTC - after Round of 64 has finished, before Round of 32 starts
    const CURRENT_TIME = getCurrentTime(); // Between Round of 64 and Round of 32
    
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

