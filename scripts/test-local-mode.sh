#!/usr/bin/env bash
#
# Test script for local mode startup
# Tests Sprint 1 implementation
#

set -e  # Exit on error

echo "=========================================="
echo "Testing Sprint 1: Local Mode Startup"
echo "=========================================="
echo ""

# Clean up test data directory
echo "🧹 Cleaning up old test data..."
rm -rf ./local-data-test
echo "✓ Test data directory cleaned"
echo ""

# Set environment variables for local mode
export DEPLOYMENT_MODE=local
export LOCAL_DATA_PATH=./local-data-test
export LOCAL_PORT=5231
export NODE_ENV=production

echo "📋 Configuration:"
echo "  DEPLOYMENT_MODE: $DEPLOYMENT_MODE"
echo "  LOCAL_DATA_PATH: $LOCAL_DATA_PATH"
echo "  LOCAL_PORT: $LOCAL_PORT"
echo ""

# Start the server in background
echo "🚀 Starting server in local mode..."
node dist/index.js > /tmp/cyberdocgen-test.log 2>&1 &
SERVER_PID=$!

echo "  Server PID: $SERVER_PID"
echo "  Waiting for startup..."
sleep 5

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "❌ Server failed to start!"
  echo ""
  echo "Last 50 lines of log:"
  tail -50 /tmp/cyberdocgen-test.log
  exit 1
fi

echo "✓ Server started successfully"
echo ""

# Test health endpoint
echo "🔍 Testing health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5231/health)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Health endpoint responded with HTTP $HTTP_CODE"
else
  echo "❌ Health endpoint responded with HTTP $HTTP_CODE (expected 200)"
  kill $SERVER_PID
  exit 1
fi
echo ""

# Check database file was created
echo "📁 Checking database file..."
if [ -f "./local-data-test/cyberdocgen.db" ]; then
  DB_SIZE=$(ls -lh ./local-data-test/cyberdocgen.db | awk '{print $5}')
  echo "✓ Database file created: $DB_SIZE"
else
  echo "❌ Database file not created!"
  kill $SERVER_PID
  exit 1
fi
echo ""

# Check storage directory was created
echo "📁 Checking storage directory..."
if [ -d "./local-data-test/files" ]; then
  echo "✓ Storage directory created"
else
  echo "❌ Storage directory not created!"
  kill $SERVER_PID
  exit 1
fi
echo ""

# Display server logs
echo "📜 Server startup logs (first 100 lines):"
echo "=========================================="
head -100 /tmp/cyberdocgen-test.log | grep -E "(DEPLOYMENT|Database|Provider|Server started|Migration)" || true
echo "=========================================="
echo ""

# Graceful shutdown
echo "🛑 Shutting down server..."
kill -TERM $SERVER_PID
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
  echo "  Force killing server..."
  kill -9 $SERVER_PID
fi

echo "✓ Server stopped"
echo ""

# Final checks
echo "✅ Sprint 1 Local Mode Test Results:"
echo "  ✓ Server started in local mode"
echo "  ✓ Database provider initialized"
echo "  ✓ Storage provider initialized"
echo "  ✓ SQLite database file created"
echo "  ✓ Storage directory created"
echo "  ✓ Health endpoint accessible"
echo ""

echo "🎉 All tests passed!"
echo ""

# Show created files
echo "📂 Created files:"
find ./local-data-test -type f -o -type d | head -20
