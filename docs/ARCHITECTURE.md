# FraudPulse Architecture Notes

## Data flow

1. The simulator posts transactions to `POST /transactions` on the API.
2. The API writes the transaction to Postgres and enqueues a BullMQ job in Redis.
3. The worker consumes jobs from Redis, calls the ML service `/score`, and stores alerts.
4. The dashboard polls the API for alerts, metrics, and transactions.

```
+---------------------+       +-------------------+       +------------------+
| Simulator           | ----> | API /transactions | ----> | Redis (BullMQ)   |
+---------------------+       +-------------------+       +---------+--------+
                                                                |
                                                                v
                                                         +------+------+
                                                         | Worker      |
                                                         +------+------+
                                                                |
                                                                v
                                                         +------+------+
                                                         | ML /score   |
                                                         +------+------+
                                                                |
                                                                v
                                                         +------+------+
                                                         | Postgres    |
                                                         | alerts/tx   |
                                                         +------+------+

+------------------+        +-------------------+        +------------------------+
| Web Dashboard    | <----- | API /alerts       | <----- | ML /model metadata     |
| (Next.js)        | <----- | API /metrics      |        | (auto-trained on start)|
|                  | <----- | API /transactions |        +------------------------+
+------------------+        +-------------------+

+------------------+        +-------------------+
| Synthetic/CSV    | -----> | ML /train         |
+------------------+        +-------------------+
```

## Core services

- **API (`apps/api`)**

  - Express + Prisma + BullMQ.
  - Routes: `/transactions`, `/alerts`, `/metrics/overview`, `/model`.
  - Worker runs as a separate process and calls the ML service.

- **ML service (`services/ml`)**

  - FastAPI with synthetic training pipeline.
  - `/score` uses the trained pipeline if available; otherwise fallback heuristics.
  - `/train` persists `model.joblib` + `metadata.json`.
  - `/model` exposes training metadata for the dashboard.

- **Web (`apps/web`)**
  - Next.js App Router + Tailwind + shadcn/ui.
  - Pages: Overview, Alerts, Transactions, Model.

## Data model (Postgres)

- `Merchant`
  - `id`, `name`, `category`, `country`
- `Transaction`
  - `amount`, `currency`, `cardId`, `cardCountry`, `channel`, `entryMode`, `ipCountry`, `deviceId`, `occurredAt`
- `Alert`
  - `transactionId`, `score`, `label`, `status`, `explanation`, `recommendedAction`
- `InvestigationNote`
  - `alertId`, `author`, `note`

## Metrics

- Fraud rate is computed as the ratio of fraud alerts to total transactions over time.
- Top risky merchants are based on average alert score.
- Status counts and average score are derived from alerts.

## Model training

- Synthetic dataset generator with realistic distribution for amounts, channels, and cross-border signals.
- Logistic regression pipeline with one-hot encoding + scaling.
- Metadata includes ROC-AUC, precision, recall, threshold, and confusion matrix.
