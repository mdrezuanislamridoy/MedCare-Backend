#!/bin/sh
set -e

echo "🏥 Starting MedCare All-In-One Container..."

# 1. Start local Redis server
echo "🚀 Starting local Redis server..."
redis-server --daemonize yes --port 6379 || echo "Redis already running or skipped"

# 2. Start background microservices on localhost ports
echo "⚙️ Starting backend microservices..."
SERVICES="auth-service doctor-service patient-service appointment-service clinic-service billing-service notification-service audit-service chat-service analytics-service"

for svc in $SERVICES; do
  if [ -f "dist/apps/$svc/src/main.js" ]; then
    echo "  -> Starting $svc..."
    APP_NAME=$svc node dist/apps/$svc/src/main.js &
  fi
done

# Wait 2 seconds for microservices to bind ports
sleep 2

echo "🚀 Launching API Gateway..."
exec "$@"
