#!/bin/sh
# Database dump kept for BACKUP_KEEP_DAYS days. Run it from cron, once a day, on the host that runs docker compose.
set -eu
cd "$(dirname "$0")/../.."

DIR="${BACKUP_DIR:-/root/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
PREFIX="${BACKUP_PREFIX:-fosscord-daily}"
DB_USER="${POSTGRES_USER:-fosscord}"
DB_NAME="${POSTGRES_DB:-fosscord}"

mkdir -p "$DIR"
FILE="$DIR/$PREFIX-$(date +%Y%m%d-%H%M%S).dump"

docker compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$FILE.tmp"
# a dump pg_restore cannot read is not a backup, so it never gets the final name
if ! docker compose exec -T postgres pg_restore -l < "$FILE.tmp" > /dev/null; then
    rm -f "$FILE.tmp"
    echo "backup failed: the dump could not be read back" >&2
    exit 1
fi
mv "$FILE.tmp" "$FILE"

# only this script's own daily dumps are ever removed
find "$DIR" -name "fosscord-daily-*.dump" -mtime +"$KEEP_DAYS" -delete

echo "backup written: $FILE"
