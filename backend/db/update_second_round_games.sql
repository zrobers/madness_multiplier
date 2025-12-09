-- Update all second round games (round_code = 2) to SCHEDULED status
-- This keeps the original dates but sets status to SCHEDULED
SET search_path TO mm, public;

UPDATE mm.games
SET status = 'SCHEDULED'
WHERE round_code = 2
  AND season_year = 2024;

-- Verify the update
SELECT 
  round_code,
  COUNT(*) as total_games,
  COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled_games,
  COUNT(CASE WHEN status = 'FINAL' THEN 1 END) as final_games
FROM mm.games
WHERE round_code = 2 AND season_year = 2024
GROUP BY round_code;

