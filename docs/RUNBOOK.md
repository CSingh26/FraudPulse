# FraudPulse Runbook

## Services and ports

- API: `http://localhost:3001`
- Web: `http://localhost:3000`
- ML: `http://localhost:8000`
- Postgres: `localhost:5433`
- Redis: `localhost:6379`
- Adminer: `http://localhost:8080`

## Local startup checklist

1. `cd infra && docker compose up -d`
2. `pnpm install`
3. `cp .env.example .env`
4. `cp apps/api/.env.example apps/api/.env`
5. `cp apps/web/.env.example apps/web/.env`
6. `cp services/ml/.env.example services/ml/.env`
7. `pnpm db:migrate`
8. `pnpm seed`
9. `pnpm dev`
10. `pnpm --filter @fraudpulse/api worker`
11. `cd services/ml && python3 -m uvicorn app.main:app --reload --port 8000`

## Simulator

Run the simulator to push synthetic transactions continuously:

```
pnpm simulate
```

Environment variables:

- `SIMULATOR_API_URL`: API base URL (default `http://localhost:3001`)
- `SIMULATOR_RATE_PER_SEC`: transactions per second (default `2`)

## ML training

Trigger model training (requires `TRAIN_TOKEN` in `services/ml/.env`):

```
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -H "X-Train-Token: <token>" \
  -d '{"sample_size": 5000}'
```

Use `DATASET_PATH` or the request body to train on a local CSV that matches the expected columns.

## Troubleshooting

- **Prisma generate fails**: ensure you have write access to `~/.cache/prisma`. Re-run tests with elevated permissions if needed.
- **Redis connection errors**: check `REDIS_URL` and confirm `infra` services are up.
- **ML scoring errors**: verify `ML_URL` in `apps/api/.env` and that the FastAPI service is running.
- **No alerts showing**: the worker only writes alerts when ML labels the transaction as `FRAUD`.

## Tests

- API tests: `RUN_INTEGRATION_TESTS=true pnpm test:api`
- ML tests: `pnpm test:ml`
