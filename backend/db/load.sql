
SET search_path TO mm, public;


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


COPY mm.tournaments(season_year)
FROM '/seed/tournaments_2024.csv'
CSV HEADER;

COPY mm.teams(team_name)
FROM '/seed/teams_2024.csv'
CSV HEADER;

INSERT INTO mm.users (user_id, handle, initials, email, created_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'zach',    'ZR', 'zach@madness.com',   now()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'andrew',  'AT', 'andrew@madness.com', now()),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'charlie', 'CK', 'charlie@madness.com',now()),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid, 'justin',  'JA', 'justin@madness.com', now()),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid, 'logan',   'LD', 'logan@madness.com',  now());


INSERT INTO mm.pools (pool_id, name, owner_user_id, season_year, initial_points, created_at)
VALUES (
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
  'Team Madness 2024',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  2024,
  1000,
  now()
);

-- Add all users to the pool
INSERT INTO mm.pool_members (pool_id, user_id, joined_at)
SELECT 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid, user_id, now() FROM mm.users;


CREATE TEMP TABLE games_temp (
  season_year     SMALLINT,
  round_code      SMALLINT,
  region          VARCHAR(16),
  game_no         INTEGER,
  start_time_utc  TIMESTAMPTZ,
  team_a_name     VARCHAR(80),
  team_b_name     VARCHAR(80),
  team_a_seed     SMALLINT,
  team_b_seed     SMALLINT,
  status          TEXT,
  score_a         SMALLINT,
  score_b         SMALLINT,
  winner_name     VARCHAR(80)
);

COPY games_temp
FROM '/seed/games_2024.csv'
CSV HEADER;

INSERT INTO mm.games (
  season_year, round_code, region, game_no, start_time_utc,
  team_a_id, team_b_id, team_a_seed, team_b_seed,
  status, score_a, score_b, winner_team_id
)
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
  COALESCE(gt.status, 'SCHEDULED'),
  gt.score_a,
  gt.score_b,
  tw.team_id AS winner_team_id
FROM games_temp gt
JOIN mm.teams ta ON ta.team_name = gt.team_a_name
JOIN mm.teams tb ON tb.team_name = gt.team_b_name
LEFT JOIN mm.teams tw ON tw.team_name = gt.winner_name;

DROP TABLE games_temp;


-- Initialize every user to 1000 points (ledger)

INSERT INTO mm.transactions (pool_id, user_id, tx_type, amount_points, notes, created_at)
SELECT
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
  user_id,
  'INIT_CREDIT',
  1000,
  'Initial starting balance',
  now()
FROM mm.users;


-- Verify that data loaded successfully

SELECT 'tournaments' AS table_name, COUNT(*) AS row_count FROM mm.tournaments
UNION ALL SELECT 'teams', COUNT(*) FROM mm.teams
UNION ALL SELECT 'users', COUNT(*) FROM mm.users
UNION ALL SELECT 'pools', COUNT(*) FROM mm.pools
UNION ALL SELECT 'pool_members', COUNT(*) FROM mm.pool_members
UNION ALL SELECT 'games', COUNT(*) FROM mm.games
UNION ALL SELECT 'transactions', COUNT(*) FROM mm.transactions;
