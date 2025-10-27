-- Set the schema path
SET search_path TO mm, public;

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE mm.transactions CASCADE;
TRUNCATE TABLE mm.wagers CASCADE;
TRUNCATE TABLE mm.games CASCADE;
TRUNCATE TABLE mm.pool_members CASCADE;
TRUNCATE TABLE mm.pools CASCADE;
TRUNCATE TABLE mm.users CASCADE;
TRUNCATE TABLE mm.tournaments CASCADE;
TRUNCATE TABLE mm.teams CASCADE;
TRUNCATE TABLE mm.round_balance_snapshots CASCADE;
TRUNCATE TABLE mm.leaderboard_snapshots CASCADE;

-- Insert tournament season
\copy mm.tournaments(season_year) FROM '/usr/src/app/db/data/tournaments_2024.csv' WITH (FORMAT CSV, HEADER);

-- Insert teams from CSV
\copy mm.teams(team_name) FROM '/usr/src/app/db/data/teams_2024.csv' WITH (FORMAT CSV, HEADER);

-- Insert users
INSERT INTO mm.users (user_id, handle, initials, email, created_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'zach', 'ZR', 'zach@madness.com', now()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'andrew', 'AT', 'andrew@madness.com', now()),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'charlie', 'CK', 'charlie@madness.com', now()),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid, 'justin', 'JA', 'justin@madness.com', now()),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid, 'logan', 'LD', 'logan@madness.com', now());

-- Insert a pool for 2024
INSERT INTO mm.pools (pool_id, name, owner_user_id, season_year, initial_points, created_at) 
VALUES ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid, 'Team Madness 2024', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 2024, 1000, now());

-- Add all users to the pool
INSERT INTO mm.pool_members (pool_id, user_id, joined_at)
SELECT 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid, user_id, now() FROM mm.users;

-- Insert tournament games with proper team references
-- Note: This requires the teams to be in the database first
-- For now, inserting a simplified version with temp data that will need to be populated

-- Since we need to reference team_ids, we'll insert games with temporary placeholder data
-- The actual game data should be loaded via a script that maps team names to IDs

-- Create a temporary table for games data with team names
CREATE TEMP TABLE games_temp (
  season_year SMALLINT,
  round_code SMALLINT,
  region VARCHAR(16),
  game_no INTEGER,
  start_time_utc TIMESTAMPTZ,
  team_a_name VARCHAR(80),
  team_b_name VARCHAR(80),
  team_a_seed SMALLINT,
  team_b_seed SMALLINT,
  status TEXT,
  score_a SMALLINT,
  score_b SMALLINT,
  winner_name VARCHAR(80)
);

-- Load the games CSV into temp table
\copy games_temp FROM '/usr/src/app/db/data/games_2024.csv' WITH (FORMAT CSV, HEADER);

-- Insert games by joining team names to team_ids
INSERT INTO mm.games (season_year, round_code, region, game_no, start_time_utc, 
                      team_a_id, team_b_id, team_a_seed, team_b_seed, 
                      status, score_a, score_b, winner_team_id)
SELECT 
  gt.season_year,
  gt.round_code,
  gt.region,
  gt.game_no,
  gt.start_time_utc::timestamptz,
  ta.team_id AS team_a_id,
  tb.team_id AS team_b_id,
  gt.team_a_seed,
  gt.team_b_seed,
  gt.status,
  gt.score_a,
  gt.score_b,
  tw.team_id AS winner_team_id
FROM games_temp gt
JOIN mm.teams ta ON ta.team_name = gt.team_a_name
JOIN mm.teams tb ON tb.team_name = gt.team_b_name
LEFT JOIN mm.teams tw ON tw.team_name = gt.winner_name;

-- Drop temp table
DROP TABLE games_temp;

-- Initialize user balances with starting points
INSERT INTO mm.transactions (pool_id, user_id, tx_type, amount_points, notes, created_at)
SELECT 
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
  user_id,
  'INIT_CREDIT',
  1000,
  'Initial pool balance',
  now()
FROM mm.users;

-- Verify counts
SELECT 
  'tournaments' as table_name, COUNT(*) as row_count FROM mm.tournaments
UNION ALL
SELECT 'teams', COUNT(*) FROM mm.teams
UNION ALL
SELECT 'users', COUNT(*) FROM mm.users
UNION ALL
SELECT 'pools', COUNT(*) FROM mm.pools
UNION ALL
SELECT 'pool_members', COUNT(*) FROM mm.pool_members
UNION ALL
SELECT 'games', COUNT(*) FROM mm.games
UNION ALL
SELECT 'transactions', COUNT(*) FROM mm.transactions;
