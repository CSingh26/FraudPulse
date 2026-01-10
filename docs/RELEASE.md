# FraudPulse v1.0.0 Release Notes

## Highlights

- End-to-end real-time fraud pipeline with simulator, BullMQ worker, ML scoring, and alert storage.
- Analyst dashboard with overview KPIs, alerts workflow, transactions, and model health.
- FastAPI model service with synthetic training, persisted artifacts, and confusion matrix metadata.
- Dockerized infra for Postgres + Redis with local runbook and one-command launch script.

## Components

- API: Express + Prisma + BullMQ, alert lifecycle APIs, metrics, and model metadata proxy.
- ML: FastAPI with training pipeline, scoring, and metadata endpoints.
- Web: Next.js App Router dashboard with filters, tables, and model reporting.
- Shared: Zod schemas and lightweight SDK.

## Testing

- API integration tests for /transactions and /alerts.
- ML unit tests for scorer output shape.

## Getting started

1. Configure env files: `cp .env.example .env` (plus app-specific envs).
2. Run `./scripts/launch.sh` to start infra, run tests, and launch all services.
3. Open `http://localhost:3000` for the dashboard.

## Notes

- Postgres is exposed on `localhost:5433` to avoid local conflicts.
- The ML service auto-trains on startup if artifacts are missing.
