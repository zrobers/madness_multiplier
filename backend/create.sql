-- Create a dedicated schema
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'mm')
    EXEC('CREATE SCHEMA mm');
GO

/* ---------- Reference & enums ---------- */

-- Rounds (fixed list to keep queries readable & constrainted)
CREATE TABLE mm.rounds (
    round_code  TINYINT     NOT NULL PRIMARY KEY, -- 1=R64,2=R32,3=S16,4=E8,5=F4,6=Final
    name        VARCHAR(32) NOT NULL UNIQUE
);
INSERT INTO mm.rounds (round_code, name) VALUES
(1,'Round of 64'),(2,'Round of 32'),(3,'Sweet 16'),
(4,'Elite Eight'),(5,'Final Four'),(6,'Title Game');

-- Teams (historical-safe; use your ESPN/team-key later if desired)
CREATE TABLE mm.teams (
    team_id     INT IDENTITY PRIMARY KEY,
    team_name   VARCHAR(80) NOT NULL UNIQUE
);

-- Seasons/tournaments (one per NCAA tournament)
CREATE TABLE mm.tournaments (
    season_year SMALLINT PRIMARY KEY,              -- e.g., 2025
    created_at  DATETIME2(0) NOT NULL CONSTRAINT df_tournaments_created DEFAULT SYSUTCDATETIME()
);

/* ---------- Users & Pools ---------- */

CREATE TABLE mm.users (
    user_id     UNIQUEIDENTIFIER NOT NULL ROWGUIDCOL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    auth0_sub   NVARCHAR(120) NULL UNIQUE,         -- auth subject (or keep NULL pre-auth)
    handle      VARCHAR(50) NOT NULL UNIQUE,       -- display/user name
    initials    VARCHAR(6)  NULL,                  -- optional (for your sheet-style views)
    email       VARCHAR(254) NULL,
    created_at  DATETIME2(0) NOT NULL CONSTRAINT df_users_created DEFAULT SYSUTCDATETIME()
);

CREATE TABLE mm.pools (
    pool_id             UNIQUEIDENTIFIER NOT NULL ROWGUIDCOL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    name                VARCHAR(80)  NOT NULL,
    owner_user_id       UNIQUEIDENTIFIER NOT NULL,
    season_year         SMALLINT NOT NULL REFERENCES mm.tournaments(season_year),
    initial_points      INT NOT NULL CONSTRAINT df_pools_initial DEFAULT (1000),
    unbet_penalty_pct   DECIMAL(5,2) NOT NULL CONSTRAINT df_pools_penalty DEFAULT (20.00), -- per round
    allow_multi_bets    BIT NOT NULL CONSTRAINT df_pools_multi DEFAULT (1),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT df_pools_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pools_owner FOREIGN KEY (owner_user_id) REFERENCES mm.users(user_id)
);

CREATE TABLE mm.pool_members (
    pool_id     UNIQUEIDENTIFIER NOT NULL,
    user_id     UNIQUEIDENTIFIER NOT NULL,
    joined_at   DATETIME2(0) NOT NULL CONSTRAINT df_pool_members_joined DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (pool_id, user_id),
    CONSTRAINT fk_pool_members_pool FOREIGN KEY (pool_id) REFERENCES mm.pools(pool_id),
    CONSTRAINT fk_pool_members_user FOREIGN KEY (user_id) REFERENCES mm.users(user_id)
);

/* ---------- Games & Seeding ---------- */

CREATE TABLE mm.games (
    game_id         BIGINT IDENTITY PRIMARY KEY,
    season_year     SMALLINT NOT NULL REFERENCES mm.tournaments(season_year),
    round_code      TINYINT  NOT NULL REFERENCES mm.rounds(round_code),
    region          VARCHAR(16) NULL,              -- "East/West/Midwest/South" (optional)
    game_no         INT NULL,                      -- bracket order if you want it
    start_time_utc  DATETIME2(0) NULL,

    team_a_id       INT NOT NULL REFERENCES mm.teams(team_id),
    team_b_id       INT NOT NULL REFERENCES mm.teams(team_id),
    team_a_seed     TINYINT NOT NULL CHECK (team_a_seed BETWEEN 1 AND 16),
    team_b_seed     TINYINT NOT NULL CHECK (team_b_seed BETWEEN 1 AND 16),

    status          VARCHAR(16) NOT NULL CONSTRAINT df_games_status DEFAULT ('SCHEDULED')
                    CHECK (status IN ('SCHEDULED','IN_PROGRESS','FINAL','CANCELED')),
    score_a         SMALLINT NULL,
    score_b         SMALLINT NULL,
    winner_team_id  INT NULL REFERENCES mm.teams(team_id),
    settled_at      DATETIME2(0) NULL
);

-- Fast lookups by round/region
CREATE INDEX ix_games_round ON mm.games (season_year, round_code, region);

/* ---------- Wagers & ledger ---------- */

-- Persist odds at placement time to avoid any rule drift
CREATE TABLE mm.wagers (
    wager_id        BIGINT IDENTITY PRIMARY KEY,
    pool_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.pools(pool_id),
    user_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.users(user_id),
    game_id         BIGINT NOT NULL REFERENCES mm.games(game_id),

    picked_team_id  INT NOT NULL REFERENCES mm.teams(team_id),
    picked_seed     TINYINT NOT NULL CHECK (picked_seed BETWEEN 1 AND 16),
    opp_seed        TINYINT NOT NULL CHECK (opp_seed BETWEEN 1 AND 16),

    stake_points    DECIMAL(18,2) NOT NULL CHECK (stake_points > 0),
    posted_odds     DECIMAL(9,4)  NOT NULL,       -- e.g., 1 + seed/opp_seed

    placed_at       DATETIME2(0) NOT NULL CONSTRAINT df_wagers_placed DEFAULT SYSUTCDATETIME(),
    status          VARCHAR(12) NOT NULL CONSTRAINT df_wagers_status DEFAULT ('OPEN')
                    CHECK (status IN ('OPEN','WON','LOST','VOID','SETTLED')),
    settled_at      DATETIME2(0) NULL,
    payout_points   DECIMAL(18,2) NULL            -- stake * posted_odds if WON (persisted)

    -- Note: balance checks at placement time enforced in stored proc, not constraint.
);
CREATE INDEX ix_wagers_pool_game ON mm.wagers (pool_id, game_id);
CREATE INDEX ix_wagers_user ON mm.wagers (user_id, placed_at);

-- General-purpose, auditable ledger (all point changes are here)
-- Positive amount increases balance; negative decreases.
CREATE TABLE mm.transactions (
    tx_id           BIGINT IDENTITY PRIMARY KEY,
    pool_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.pools(pool_id),
    user_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.users(user_id),
    round_code      TINYINT NULL REFERENCES mm.rounds(round_code), -- nullable for non-round ops

    tx_type         VARCHAR(20) NOT NULL CHECK (tx_type IN (
                        'INIT_CREDIT','WAGER_STAKE','WAGER_WIN','WAGER_VOID',
                        'PENALTY','ADJUSTMENT','REFUND','BUY_IN'
                    )),
    amount_points   DECIMAL(18,2) NOT NULL,     -- +/-
    wager_id        BIGINT NULL REFERENCES mm.wagers(wager_id),
    game_id         BIGINT NULL REFERENCES mm.games(game_id),
    notes           VARCHAR(200) NULL,
    created_at      DATETIME2(0) NOT NULL CONSTRAINT df_tx_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX ix_tx_pool_user ON mm.transactions (pool_id, user_id, created_at);
CREATE INDEX ix_tx_round ON mm.transactions (pool_id, round_code, created_at);

-- Snapshot the balance at the *start* of each round to support penalties
CREATE TABLE mm.round_balance_snapshots (
    pool_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.pools(pool_id),
    round_code      TINYINT NOT NULL REFERENCES mm.rounds(round_code),
    user_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.users(user_id),
    start_balance_points DECIMAL(18,2) NOT NULL,
    snap_time_utc   DATETIME2(0) NOT NULL CONSTRAINT df_rbs_snap DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (pool_id, round_code, user_id)
);

-- Optional: store leaderboard standings per round for history/reports
CREATE TABLE mm.leaderboard_snapshots (
    pool_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.pools(pool_id),
    round_code      TINYINT NOT NULL REFERENCES mm.rounds(round_code),
    user_id         UNIQUEIDENTIFIER NOT NULL REFERENCES mm.users(user_id),
    rank_in_pool    INT NOT NULL,
    points_end_of_round DECIMAL(18,2) NOT NULL,
    created_at      DATETIME2(0) NOT NULL CONSTRAINT df_lb_snap_created DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (pool_id, round_code, user_id)
);

/* ---------- Helper function for odds (for procs) ---------- */
GO
CREATE OR ALTER FUNCTION mm.fn_seed_odds (
    @picked_seed TINYINT,
    @opp_seed    TINYINT
) RETURNS DECIMAL(9,4)
AS
BEGIN
    RETURN CONVERT(DECIMAL(9,4), 1.0 + (CONVERT(DECIMAL(9,4), @picked_seed) / NULLIF(@opp_seed,0)));
END
GO

/* ---------- Views for balances & leaderboards ---------- */

-- Current balance per user in a pool from the ledger
CREATE OR ALTER VIEW mm.vw_pool_balances AS
SELECT
    t.pool_id,
    t.user_id,
    SUM(t.amount_points) AS current_points
FROM mm.transactions AS t
GROUP BY t.pool_id, t.user_id;

-- Simple current leaderboard by pool
CREATE OR ALTER VIEW mm.vw_pool_leaderboard AS
SELECT
    b.pool_id,
    b.user_id,
    u.handle,
    u.initials,
    b.current_points,
    DENSE_RANK() OVER (PARTITION BY b.pool_id ORDER BY b.current_points DESC) AS rank_in_pool
FROM mm.vw_pool_balances AS b
JOIN mm.users u ON u.user_id = b.user_id;
GO
