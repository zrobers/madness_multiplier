#!/usr/bin/env bash
set -euo pipefail

# Move SQL files out of the init root so the entrypoint won't run them again
mkdir -p /docker-entrypoint-initdb.d/run

if [ -f /docker-entrypoint-initdb.d/create.sql ]; then
  mv /docker-entrypoint-initdb.d/create.sql /docker-entrypoint-initdb.d/run/create.sql
fi

if [ -f /docker-entrypoint-initdb.d/load.sql ]; then
  mv /docker-entrypoint-initdb.d/load.sql /docker-entrypoint-initdb.d/run/load.sql
fi

echo "Applying schema (create.sql)…"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/run/create.sql

echo "Seeding data (load.sql)…"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/run/load.sql

echo "DB init complete."
