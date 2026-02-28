#!/bin/sh
set -e
echo "Waiting for database and applying migrations..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if npx prisma migrate deploy; then
    echo "Migrations applied."
    break
  fi
  if [ "$i" = 10 ]; then
    echo "Failed to apply migrations after 10 attempts."
    exit 1
  fi
  echo "Retry $i/10 in 3s..."
  sleep 3
done
echo "Starting application..."
exec node dist/main.js
