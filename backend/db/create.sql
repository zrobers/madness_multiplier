-- Enable UUID generator (use either pgcrypto or uuid-ossp)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Schema
CREATE SCHEMA IF NOT EXISTS mm;

-- 2) Reference tables
CREATE TABLE IF NOT EXISTS mm.rounds (
  round_code  SMALLINT PRIMARY KEY,          -- 1=R64,2=R32,3=S16,4=E8,5=F4,6=Final
  name        VARCHAR(32) NOT NULL UNIQUE
);

INSERT INTO mm.rounds (round_code, name) VALUES
  (1,'Round of 64'),(2,'Round of 32'),(3,'Sweet 16'),
  (4,'Elite Eight'),(5,'Final Four'),(6,'Title Game')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS mm.teams (
  team_id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_name  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS mm.tournaments (
  season_year  SMALLINT PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Users & Pools
CREATE TABLE IF NOT EXISTS mm.users (
  user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_sub   TEXT UNIQUE,
  handle      VARCHAR(50) NOT NULL UNIQUE,
  initials    VARCHAR(6),
  email       VARCHAR(254),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mm.pools (
  pool_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(80) NOT NULL,
  owner_user_id      UUID NOT NULL REFERENCES mm.users(user_id),
  season_year        SMALLINT NOT NULL REFERENCES mm.tournaments(season_year),
  initial_points     INTEGER NOT NULL DEFAULT 1000,
  unbet_penalty_pct  NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  allow_multi_bets   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mm.pool_members (
  pool_id   UUID NOT NULL REFERENCES mm.pools(pool_id),
  user_id   UUID NOT NULL REFERENCES mm.users(user_id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pool_id, user_id)
);

-- 4) Games
CREATE TABLE IF NOT EXISTS mm.games (
  game_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season_year    SMALLINT NOT NULL REFERENCES mm.tournaments(season_year),
  round_code     SMALLINT NOT NULL REFERENCES mm.rounds(round_code),
  region         VARCHAR(16),
  game_no        INTEGER,
  start_time_utc TIMESTAMPTZ,

  team_a_id      INTEGER NOT NULL REFERENCES mm.teams(team_id),
  team_b_id      INTEGER NOT NULL REFERENCES mm.teams(team_id),
  team_a_seed    SMALLINT NOT NULL CHECK (team_a_seed BETWEEN 1 AND 16),
  team_b_seed    SMALLINT NOT NULL CHECK (team_b_seed BETWEEN 1 AND 16),

  status         TEXT NOT NULL DEFAULT 'SCHEDULED'
                 CHECK (status IN ('SCHEDULED','IN_PROGRESS','FINAL','CANCELED')),
  score_a        SMALLINT,
  score_b        SMALLINT,
  winner_team_id INTEGER REFERENCES mm.teams(team_id),
  settled_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_games_round ON mm.games (season_year, round_code, region);

-- 5) Wagers
CREATE TABLE IF NOT EXISTS mm.wagers (
  wager_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pool_id        UUID NOT NULL REFERENCES mm.pools(pool_id),
  user_id        UUID NOT NULL REFERENCES mm.users(user_id),
  game_id        BIGINT NOT NULL REFERENCES mm.games(game_id),

  picked_team_id INTEGER NOT NULL REFERENCES mm.teams(team_id),
  picked_seed    SMALLINT NOT NULL CHECK (picked_seed BETWEEN 1 AND 16),
  opp_seed       SMALLINT NOT NULL CHECK (opp_seed BETWEEN 1 AND 16),

  stake_points   NUMERIC(18,2) NOT NULL CHECK (stake_points > 0),
  posted_odds    NUMERIC(9,4)  NOT NULL,

  placed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status         TEXT NOT NULL DEFAULT 'OPEN'
                 CHECK (status IN ('OPEN','WON','LOST','VOID','SETTLED')),
  settled_at     TIMESTAMPTZ,
  payout_points  NUMERIC(18,2)
);
CREATE INDEX IF NOT EXISTS ix_wagers_pool_game ON mm.wagers (pool_id, game_id);
CREATE INDEX IF NOT EXISTS ix_wagers_user ON mm.wagers (user_id, placed_at);

-- 6) Ledger
CREATE TABLE IF NOT EXISTS mm.transactions (
  tx_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pool_id        UUID NOT NULL REFERENCES mm.pools(pool_id),
  user_id        UUID NOT NULL REFERENCES mm.users(user_id),
  round_code     SMALLINT REFERENCES mm.rounds(round_code),

  tx_type        TEXT NOT NULL CHECK (tx_type IN
                  ('INIT_CREDIT','WAGER_STAKE','WAGER_WIN','WAGER_VOID',
                   'PENALTY','ADJUSTMENT','REFUND','BUY_IN')),
  amount_points  NUMERIC(18,2) NOT NULL,        -- +/-
  wager_id       BIGINT REFERENCES mm.wagers(wager_id),
  game_id        BIGINT REFERENCES mm.games(game_id),
  notes          VARCHAR(200),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tx_pool_user ON mm.transactions (pool_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_tx_round ON mm.transactions (pool_id, round_code, created_at);

-- 7) Round snapshots & leaderboard snapshots
CREATE TABLE IF NOT EXISTS mm.round_balance_snapshots (
  pool_id               UUID NOT NULL REFERENCES mm.pools(pool_id),
  round_code            SMALLINT NOT NULL REFERENCES mm.rounds(round_code),
  user_id               UUID NOT NULL REFERENCES mm.users(user_id),
  start_balance_points  NUMERIC(18,2) NOT NULL,
  snap_time_utc         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pool_id, round_code, user_id)
);

CREATE TABLE IF NOT EXISTS mm.leaderboard_snapshots (
  pool_id              UUID NOT NULL REFERENCES mm.pools(pool_id),
  round_code           SMALLINT NOT NULL REFERENCES mm.rounds(round_code),
  user_id              UUID NOT NULL REFERENCES mm.users(user_id),
  rank_in_pool         INTEGER NOT NULL,
  points_end_of_round  NUMERIC(18,2) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pool_id, round_code, user_id)
);

-- 8) Odds helper
CREATE OR REPLACE FUNCTION mm.fn_seed_odds(picked_seed SMALLINT, opp_seed SMALLINT)
RETURNS NUMERIC(9,4)
LANGUAGE sql IMMUTABLE RETURNS NULL ON NULL INPUT AS
$$
  SELECT 1.0 + (picked_seed::numeric / NULLIF(opp_seed,0));
$$;

-- 9) Convenience views
CREATE OR REPLACE VIEW mm.vw_pool_balances AS
SELECT
  t.pool_id,
  t.user_id,
  SUM(t.amount_points) AS current_points
FROM mm.transactions t
GROUP BY t.pool_id, t.user_id;

CREATE OR REPLACE VIEW mm.vw_pool_leaderboard AS
SELECT
  b.pool_id,
  b.user_id,
  u.handle,
  u.initials,
  b.current_points,
  DENSE_RANK() OVER (PARTITION BY b.pool_id ORDER BY b.current_points DESC) AS rank_in_pool
FROM mm.vw_pool_balances b
JOIN mm.users u ON u.user_id = b.user_id;
