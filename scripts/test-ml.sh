#!/usr/bin/env bash
set -euo pipefail
# The established workflow invokes this entry point. CI also provisions the
# Python runtime and runs the complete cross-service release gate below.
if [[ "${CI:-}" == "true" ]]; then
  python3 -m pip install -r services/ml/requirements.txt
fi
PYTHONPATH=services/ml python3 -m unittest discover -s services/ml/tests
if [[ "${CI:-}" == "true" ]]; then
  python3 -m ruff check services/ml --select E9,F63,F7,F82,F401,F841
  pnpm typecheck
  pnpm build
  pnpm exec playwright install --with-deps chromium
  pnpm test:e2e
fi
