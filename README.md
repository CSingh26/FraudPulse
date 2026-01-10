# FraudPulse

FraudPulse is a production-ready monorepo for real-time fraud detection and an analyst dashboard. It ingests transactions, scores them via a model service, and surfaces alerts for investigation.

## Architecture

```
+--------------+        +-------------------+       +------------------+
| Simulator    | -----> | API /transactions | ----> | Redis (BullMQ)   |
+--------------+        +-------------------+       +---------+--------+
                                                               |
                                                               v
                                                        +------+------+
                                                        | Worker      |
                                                        +------+------+
                                                               |
                                                               v
                                                        +------+------+
                                                        | ML Service  |
                                                        |  /score     |
                                                        +------+------+
                                                               |
                                                               v
                                                        +------+------+
                                                        | Postgres    |
                                                        | alerts/tx   |
                                                        +------+------+

+----------------+        +-------------------+
| Web Dashboard  | <----- | API /alerts       |
| (Next.js)      | <----- | API /metrics      |
|                | <----- | API /transactions |
|                | <----- | API /model        |
+----------------+        +-------------------+
```

## Repository layout

- `apps/api`: Express + Prisma + BullMQ API
- `apps/web`: Next.js analyst dashboard
- `services/ml`: FastAPI model service
- `infra`: docker-compose for Postgres, Redis, Adminer
- `shared`: shared types/SDK (reserved for future extensions)
- `docs`: architecture notes and runbook

## Quick start

1. Start infra (Postgres + Redis):

```
cd infra
docker compose up -d
```

2. Install dependencies:

```
pnpm install
```

3. Configure environment:

```
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp services/ml/.env.example services/ml/.env
```

4. Run migrations + seed:

```
pnpm db:migrate
pnpm seed
```

5. Start services (use separate terminals):

```
pnpm dev
pnpm --filter @fraudpulse/api worker
cd services/ml && python3 -m uvicorn app.main:app --reload --port 8000
```

6. Run the simulator (optional):

```
pnpm simulate
```

## Useful commands

- `pnpm dev`: run web + api dev servers
- `pnpm --filter @fraudpulse/api worker`: run BullMQ worker
- `pnpm simulate`: stream synthetic transactions
- `pnpm test:api`: run API tests (set `RUN_INTEGRATION_TESTS=true`)
- `pnpm test:ml`: run ML unit tests

## Service endpoints

- API: `http://localhost:3001`
- Web: `http://localhost:3000`
- ML: `http://localhost:8000`
- Adminer: `http://localhost:8080`

For more details, see `docs/RUNBOOK.md` and `docs/ARCHITECTURE.md`.
