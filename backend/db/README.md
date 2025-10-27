# Database Setup for Madness Multiplier

This directory contains the database schema and data files for the Madness Multiplier application.

## Files

- `create.sql` - Creates all database tables, indexes, views, and functions
- `load.sql` - Loads historical 2024 tournament data into the database
- `data/` - CSV files containing 2024 tournament data
  - `teams_2024.csv` - All 68 teams in the 2024 tournament
  - `games_2024.csv` - All first-round games with scores and results
  - `tournaments_2024.csv` - Tournament season (2024)

## Setup Instructions

### 1. Start Database Services

First, start the PostgreSQL database and pgAdmin services:

```bash
docker compose up db pgadmin -d
```

### 2. Access pgAdmin

Open your browser and go to:
- URL: http://localhost:5050
- Email: admin@madness.com
- Password: admin123

### 3. Connect to Database in pgAdmin

1. Right-click "Servers" → "Create" → "Server"
2. General tab:
   - Name: Madness DB
3. Connection tab:
   - Host name/address: db
   - Port: 5432
   - Username: postgres
   - Password: postgres
4. Click "Save"

### 4. Create Schema and Load Data

In pgAdmin's Query Tool (after connecting to the Madness DB server):

1. Run `create.sql` to create all tables, indexes, views, and functions
2. Run `load.sql` to populate the database with 2024 tournament data

Or use the command line:

```bash
# From the backend/db directory
psql -h localhost -p 5433 -U postgres -d madness -f create.sql
psql -h localhost -p 5433 -U postgres -d madness -f load.sql
```

## Schema Overview

The `mm` schema contains:

- **Reference Tables**: `rounds`, `teams`, `tournaments`
- **User & Pool Tables**: `users`, `pools`, `pool_members`
- **Game Tables**: `games`
- **Wager Tables**: `wagers`
- **Transaction Tables**: `transactions`, `round_balance_snapshots`, `leaderboard_snapshots`
- **Views**: `vw_pool_balances`, `vw_pool_leaderboard`
- **Functions**: `fn_seed_odds()` for calculating odds based on seed differences

## Loaded Data

The `load.sql` script will populate:
- 1 tournament season (2024)
- 68 teams from the 2024 NCAA tournament
- 33 first-round games with actual scores and results
- 5 sample users (team members)
- 1 pool for the 2024 season
- Initial credit transactions for all users (1000 points each)

## Next Steps

After loading the data, you can:
1. View the leaderboard: `SELECT * FROM mm.vw_pool_leaderboard`
2. View all games: `SELECT * FROM mm.games ORDER BY start_time_utc`
3. View all teams: `SELECT * FROM mm.teams ORDER BY team_name`

