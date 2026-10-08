#!/bin/sh
# Restores the newest dump into a throwaway database and checks it has data, then drops it. Never touches the live database.
set -eu
cd "$(dirname "$0")/../.."

DIR="${BACKUP_DIR:-/root/backups}"
DB_USER="${POSTGRES_USER:-fosscord}"
DB_NAME="${POSTGRES_DB:-fosscord}"
TEST_DB="restore_test_$$"

LATEST="$(ls -t "$DIR"/fosscord-*.dump 2>/dev/null | head -1 || true)"
[ -n "$LATEST" ] || { echo "no dump found in $DIR" >&2; exit 1; }

psql_in() { docker compose exec -T postgres psql -U "$DB_USER" -v ON_ERROR_STOP=1 "$@"; }

psql_in -d postgres -c "CREATE DATABASE $TEST_DB" > /dev/null
trap 'psql_in -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB" > /dev/null' EXIT

docker compose exec -T postgres pg_restore -U "$DB_USER" -d "$TEST_DB" --no-owner < "$LATEST"

restored="$(psql_in -d "$TEST_DB" -tAc "select count(*) from users")"
live="$(psql_in -d "$DB_NAME" -tAc "select count(*) from users")"
echo "restored $LATEST: $restored users (the live database has $live)"
[ "$restored" -gt 0 ] || { echo "the restored copy has no users" >&2; exit 1; }
echo "restore test passed"
