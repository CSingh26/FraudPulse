# FraudPulse portfolio delivery

Repository: https://github.com/CSingh26/FraudPulse · public visibility preserved · default branch `main`.

Baseline: `a430547f6913bc525b86095cacd614937af32a3a` (21 existing commits). Verified implementation: `344b2f11dbc669121b758b67d73f3a8c7f3cb2d6` (27 total commits before this delivery record). Existing pnpm/Express/Next/FastAPI/Prisma/BullMQ architecture and Git history preserved. Git origin uses authenticated SSH for the same GitHub repository; no force push.

## Delivered capabilities

Real CSV and API input-driven behavioral analysis; deterministic explicitly labeled DEMO DATA; prior-hour velocity, prior-30-day amount/category/country/hour behavior; account isolation, simultaneous-timestamp exclusion, chronological train/validation/test, train-only scaling, validation cost-selected threshold, test confusion metrics/ROC-AUC/PR-AUC/AP, economic baselines, reproducible provenance, individual log-odds explanations and interactive analyst UI. Operational ingestion and investigation product remains available as a separate workflow.

## Observed local checks — 2026-09-08

Commands below ran from repository root; Python commands used the activated `.venv` (Python 3.12). pnpm commands used the pinned `npx --yes pnpm@9.12.0` where the host default differed.

| Command | Observed result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; pinned workspace dependencies installed |
| `PYTHONPATH=services/ml .venv/bin/python -m unittest discover -s services/ml/tests` | PASS: 15 tests |
| `RUN_INTEGRATION_TESTS=true pnpm test:api` | PASS: 3 tests with dedicated PostgreSQL and Redis, no skipped tests |
| `pnpm test:e2e` | PASS: 2 real browser tests against Next and FastAPI; demo/import/error/evidence/cost-change workflows |
| `pnpm lint` | PASS: Next ESLint and selected Ruff correctness rules |
| `pnpm typecheck` | PASS: API/shared TypeScript and Next route type generation + TypeScript |
| `pnpm build` | PASS: API/shared compiled; all 8 Next routes built |
| `pnpm audit --prod --json` | PASS: zero reported vulnerabilities in all severities |
| `.venv/bin/pip-audit --format json` | PASS: no known vulnerabilities in the installed Python environment |
| Tracked-file private-key/token pattern scan | PASS: zero matches; this is a heuristic scan, not proof of absence |
| `git ls-remote origin refs/heads/main` | matched the pushed implementation SHA |

20 tests total. No coverage percentage or production performance claim. Benign notices: deprecated Next lint CLI, historical Browserslist data, Starlette test-client migration notice, and Vite CJS notice. These were not suppressed.

CI workflow explicitly installs pinned JS/Python dependencies, runs database migrations/API tests, ML tests, lint, type checks, builds and Chromium user journeys. Earlier baseline workflow runs failed because it omitted Python dependency installation; the updated workflow fixes that. Final observed GitHub CI is recorded below after completion.

## Model demonstration observations

Deterministic seed-42 synthetic fixture, 500 rows, 300/100/100 split. At costs (review=2, false positive=5, loss fraction=1), observed threshold 0.5419925212666001, test confusion TN=94 / FP=1 / FN=0 / TP=5, precision 0.8333, recall 1.0, ROC-AUC 0.9979, AP 0.9667, trapezoidal PR-AUC 0.9633, scenario cost USD17. These are measured synthetic-fixture results and offer **no evidence of effectiveness on real bank data**. Canonical fixture SHA-256: `ede4ed87efe13af2048dc1f948d997df4c6840fce13851dd1f7f0500c8db7901`.

## Review and remaining scope

Independent CreditLens lead review identified undefined ratios, stale results on cost changes, and the prevention assumption. Undefined precision/recall now return null with regression tests. Cost changes clear results and all input controls are disabled during a request. The full-prevention assumption is disclosed in the UI and financial methodology. Reviewer follow-up is coordinated by the portfolio lead; this document does not claim self-review is independent.

The research release satisfies the requested behavioral/metric/cost/explanation workflow. Deployment limitations remain: upstream settled-label timing and provenance verification, streaming feature state/late-event semantics, model calibration and monitoring, review-capacity constraints, production auth/rate/ingress controls, durable research artifact registry and real bank validation. No automated real-payment blocking or production-readiness claim is made. The operational scorer remains a separate uncalibrated amount/category prototype; research does not silently deploy itself there.

## Verified GitHub release gate

[GitHub Actions run 34278949001](https://github.com/CSingh26/FraudPulse/actions/runs/34278949001) completed **SUCCESS** for `344b2f11dbc669121b758b67d73f3a8c7f3cb2d6` on 2026-09-08. All installation, migration, API/ML tests, lint, typecheck, build and Chromium steps passed. This delivery-record commit contains documentation only; its own final default-branch CI is verified by the portfolio orchestrator against the remote SHA.
