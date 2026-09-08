# Architecture

The existing pnpm monorepo is preserved. There are two workflows with intentionally distinct contracts.

```text
CSV / explicit demo → Next /research UI → same-origin Next API proxy
  → FastAPI research routes → validated UTC table → prior account features
  → train-only scaler/logistic fit → validation cost threshold
  → chronological test metrics, policy baselines and explanations → UI

Operational ingestion → Express /transactions → PostgreSQL + BullMQ/Redis
  → worker → FastAPI /score → persisted alerts → investigation dashboard
```

## Research boundaries
`behavior.py` owns validation and strictly historical windows. `evaluation.py` owns confusion metrics, ranking curves and financial decision cost. `research.py` composes chronological fitting and provenance. `research_routes.py` validates request scenarios and reports 422 input errors. Results are computed in memory; no uploaded CSV/model is written to disk. Next forwards to server-configured ML_URL, never a user-controlled URL; request deadlines and error responses are explicit.

The portable research path needs only Python/ML and Next, so CSV workflows do not require Postgres or Redis. The operational product retains both services. Ports used by automated browser verification are 3182/8182 to avoid collisions with other portfolio projects.

## Verification and limitations
Unit tests hand-check behavior and cost metrics; test label mutation proves separation from fitting/selection; FastAPI integration tests exercise CSV endpoints; PostgreSQL API tests exercise existing ingest/investigation state; Playwright runs a real browser against both Next and FastAPI.

The research service is suitable for local evaluation. Request parsing and concurrency should be bounded at a production ingress and protected by authentication; it is not a multi-tenant hosted service. Operational persistence/retries are preserved but the research model is never silently deployed into that queue. See MODEL_CARD.md for model release limitations.
