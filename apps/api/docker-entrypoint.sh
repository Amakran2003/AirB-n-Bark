#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z db 5432; do
  sleep 1
done
echo "Database is ready"

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