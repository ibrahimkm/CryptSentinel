#!/bin/sh
set -e

echo "=================================================="
echo " Starting CryptSentinel AI Production Engine"
echo "=================================================="

# Ensure operational directories exist
mkdir -p "${SANDBOX_DIR:-/app/monitored_sandbox}"
mkdir -p "${QUARANTINE_DIR:-/app/quarantine}"
if [ -n "$DB_PATH" ]; then
  mkdir -p "$(dirname "$DB_PATH")"
fi

# Determine Python binary (.venv or system python3)
if [ -f "/app/.venv/bin/python" ]; then
  PYTHON_BIN="/app/.venv/bin/python"
elif [ -f "./.venv/bin/python" ]; then
  PYTHON_BIN="./.venv/bin/python"
else
  PYTHON_BIN="python3"
fi

# Start Python ML Microservice in background
echo "[Launcher] Starting Python ML Microservice on port 5001..."
PYTHONPATH=. $PYTHON_BIN ml/predict.py --serve 5001 &
ML_PID=$!

# Signal handler for clean container shutdown
cleanup() {
  echo "[Launcher] Received stop signal. Gracefully shutting down CryptSentinel..."
  if [ -n "$NODE_PID" ]; then
    kill -TERM "$NODE_PID" 2>/dev/null || true
  fi
  if [ -n "$ML_PID" ]; then
    kill -TERM "$ML_PID" 2>/dev/null || true
  fi
  wait "$NODE_PID" 2>/dev/null || true
  wait "$ML_PID" 2>/dev/null || true
  echo "[Launcher] All services terminated successfully."
  exit 0
}

trap cleanup SIGTERM SIGINT

# Start Node.js Backend and Static Serving
echo "[Launcher] Starting Node.js Server on port ${PORT:-8000}..."
node server/server.js &
NODE_PID=$!

# Wait for child processes
wait -n "$ML_PID" "$NODE_PID"
cleanup
