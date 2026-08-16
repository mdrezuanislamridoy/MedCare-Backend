#!/bin/sh
set -e

echo "🏥 Starting MedCare Backend Container..."

# Generate Prisma Client
echo "⚙️ Generating Prisma Client..."
npx prisma generate

# Apply migrations if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Applying database migrations..."
  npx prisma migrate deploy || npx prisma db push || echo "⚠️ Migration check skipped or failed gracefully."
fi

echo "🚀 Launching Application..."
exec "$@"
