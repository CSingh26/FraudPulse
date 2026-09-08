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


### Cross-project regression follow-up
A later LedgerLens review exposed FastAPI's default nonfinite-error serialization edge case. FraudPulse now sanitizes validation error fields and returns422 for raw NaN, Infinity and1e999 costs. Added one regression test covering all three payloads; the ML suite now has16 tests (21 total with3 database API and2 browser tests). This is a narrow error-path change; final CI is verified against its pushed SHA.

## Subsequent verified security maintenance

Nonfinite request validation follow-up `230de0dd5783801c1aeec4d0ef7c41213de5d3e1` passed full default-branch CI: https://github.com/CSingh26/FraudPulse/actions/runs/34281570720. The ML suite now has 16 passing tests (21 total across ML/API/browser checks).

A newly available Next.js advisory GHSA-p293-qw3h-jr36 affected the earlier tested 15.5.21 pin. Next and eslint-config-next were updated together to 15.5.25 with the pnpm lock regenerated. Web lint, production build and type checks passed; the production dependency audit again returned zero known advisories. Earlier zero-advisory reports reflect their original check times, not a guarantee against future disclosures.

## Full dependency coverage follow-up

The later full dependency audit included development tooling and found advisories excluded by the earlier production-only checks. Updated Vitest to 4.1.11, tsx to 4.23.13 and sharp to 0.35.4; pinned the compatible Vite 6.4.3 line and patched transitive dependencies with major-scoped overrides (including Ajv 6.15.0, brace-expansion 1.1.18/2.1.4 and js-yaml 4.3.2). Vitest now explicitly discovers the two original source test files, avoiding duplicate compiled CommonJS copies in build output. No source tests were removed or weakened.

The complete audit now reports **zero advisories across all severities**; CI runs `pnpm audit` without a production-only filter or severity suppression. Local verification passed all 16 ML tests, 3 PostgreSQL API tests and 2 real browser journeys, web/Python lint, all workspace type checks and production builds. The implementation commit contains this evidence and the regenerated pnpm 9 lock; its immutable SHA and latest full-audit CI result are reported by the portfolio delivery task.
