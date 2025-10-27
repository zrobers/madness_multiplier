SET search_path TO mm, public;

-- Users
INSERT INTO users (username, balance) VALUES
  ('zach',    500.00),
  ('andrew',  700.00),
  ('charlie', 1000.00),
  ('justin',  900.00),
  ('logan',   800.00);

-- One pool and membership for all users
INSERT INTO pools (name) VALUES ('Team Pool A');

INSERT INTO pool_members (user_id, pool_id)
SELECT id, 1 FROM users;

-- Two teams with seeds
INSERT INTO teams (name, seed, season) VALUES
  ('Duke', 2, 2024),
  ('Princeton', 15, 2024);

-- One scheduled game (tomorrow)
INSERT INTO games (round, home_team_id, away_team_id, start_time)
VALUES ('R64', 1, 2, NOW() + INTERVAL '24 hours');
