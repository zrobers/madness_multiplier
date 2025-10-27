#!/usr/bin/env bash
set -euo pipefail

echo "Applying schema (create.sql)…"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/create.sql

echo "Seeding data (load.sql)…"
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/load.sql

echo "DB init complete."
