#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z db 5432; do
  sleep 1
done
echo "Database is ready"

# If REDIS_URL is provided, wait for Redis to be reachable before continuing
if [ -n "$REDIS_URL" ]; then
  echo "Waiting for Redis..."
  # Default to hostname 'redis' and port 6379 if REDIS_URL is not a simple host:port
  # We use nc for a simple TCP check (installed in the Dockerfile)
  until nc -z redis 6379; do
    sleep 1
  done
  echo "Redis is ready"
fi
echo "Running Prisma migrations..."
npx --no prisma db push

# Check if database has users (if empty = first run)
# Using echo + pipe for POSIX compatibility (<<< is bash-only)
USER_COUNT=$(echo "SELECT COUNT(*) FROM \"User\";" | npx --no prisma db execute --stdin 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "Database is empty, seeding..."
  node dist/prisma/seed.js
else
  echo "Database already has data, skipping seed"
fi

echo "Starting server..."
exec node dist/server.js

# — Startup script that:
# Waits for the database to be ready
# Runs prisma db push to create/sync schema
# Seeds the database only if empty
# Starts the server