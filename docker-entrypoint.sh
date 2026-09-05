#!/bin/sh
set -e

echo "🏥 Starting MedCare Container..."

# 1. Start local Redis server with lightweight memory footprint
echo "🚀 Starting local Redis server..."
redis-server --daemonize yes --port 6379 --maxmemory 32mb --maxmemory-policy allkeys-lru || echo "Redis already running or skipped"

# 2. Push Prisma database schemas if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Syncing Prisma database schemas..."
  node scripts/push-all.js || echo "⚠️ Database sync warning (continuing startup)"
fi

# 3. Start core services with memory capping to stay safely within Render's 512MB limit
# Default core services: auth, doctor, patient, appointment (can be overridden via ENABLED_SERVICES)
SERVICES="${ENABLED_SERVICES:-auth-service doctor-service patient-service appointment-service}"

echo "⚙️ Starting backend microservices: $SERVICES"
for svc in $SERVICES; do
  if [ -f "dist/apps/$svc/src/main.js" ]; then
    echo "  -> Starting $svc (max 45MB RAM)..."
    APP_NAME=$svc node --max-old-space-size=45 dist/apps/$svc/src/main.js &
  fi
done

# Wait briefly for microservices to bind ports
sleep 2

echo "🚀 Launching API Gateway..."
exec node --max-old-space-size=120 dist/apps/api-gateway/src/main.js
