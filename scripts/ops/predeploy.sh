#!/bin/sh
# Run before every deploy: takes a fresh backup, proves it restores, and checks the host is healthy.
# The deploy should not go ahead if this exits with an error.
set -eu
cd "$(dirname "$0")/../.."

echo "1/4 backup"
BACKUP_PREFIX=fosscord-predeploy ./scripts/ops/backup.sh

echo "2/4 restore test"
./scripts/ops/restore-test.sh

echo "3/4 containers"
unhealthy="$(docker compose ps --format '{{.Name}} {{.Health}}' | grep -v healthy | grep -v '^$' || true)"
if [ -n "$unhealthy" ]; then
    echo "these services are not healthy before the deploy:" >&2
    echo "$unhealthy" >&2
    exit 1
fi

echo "4/4 disk space"
free_mb="$(df -Pm . | awk 'NR==2 {print $4}')"
[ "$free_mb" -ge 3000 ] || { echo "only ${free_mb} MB free, a rebuild needs about 3000" >&2; exit 1; }

echo "ready to deploy"
