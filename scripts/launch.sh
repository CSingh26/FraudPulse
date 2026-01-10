#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/logs"
PID_DIR="${LOG_DIR}/pids"

cd "$ROOT_DIR"

mkdir -p "$PID_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install it first: https://pnpm.io/installation" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run local infrastructure." >&2
  exit 1
fi

echo "==> Starting local infrastructure"
docker compose -f infra/docker-compose.yml up -d

echo "==> Running migrations and seed"
pnpm db:migrate
pnpm seed

echo "==> Running tests"
RUN_INTEGRATION_TESTS=true pnpm test:api
pnpm test:ml

echo "==> Starting services (logs in ${LOG_DIR})"

pnpm dev > "${LOG_DIR}/dev.log" 2>&1 &
echo $! > "${PID_DIR}/dev.pid"

pnpm --filter @fraudpulse/api worker > "${LOG_DIR}/worker.log" 2>&1 &
echo $! > "${PID_DIR}/worker.pid"

(
  cd services/ml
  python3 -m uvicorn app.main:app --reload --port 8000
) > "${LOG_DIR}/ml.log" 2>&1 &
echo $! > "${PID_DIR}/ml.pid"

pnpm simulate > "${LOG_DIR}/simulator.log" 2>&1 &
echo $! > "${PID_DIR}/simulator.pid"

echo "==> FraudPulse is starting"
echo "    Web: http://localhost:3000"
echo "    API: http://localhost:3001"
echo "    ML : http://localhost:8000"
echo "    Logs: ${LOG_DIR}"
