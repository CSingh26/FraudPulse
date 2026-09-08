# FraudPulse Implementation Plan

**Goal:** Add usable, financially interpretable behavioral fraud research to the existing product.
**Architecture:** FastAPI research modules separate validation/features/evaluation. Next dashboard proxies research requests server-side. Preserve operational services.
**Tech Stack:** Python, pandas, scikit-learn, FastAPI, Next/React, pnpm.
**Spec:** docs/superpowers/specs/2026-09-08-behavioral-research.md
**Execution:** Inline under explicit autonomous user authorization; independent reviewer assigned by orchestrator.

- [ ] Write `services/ml/tests/test_research.py`: hand-calculated prior-hour counts, amount mean/deviation, simultaneous/future exclusion, currency/time/label rejection, hand-calculated threshold cost and ROC/AP cases. Run red before implementing `app/behavior.py` and `app/evaluation.py`.
- [ ] Implement chronological `app/research.py` with train-only scaling/logistic regression and validation threshold selection. Test label mutations leave threshold unchanged, deterministic reproducibility, cold starts, provenance hash and explanation reconstruction; run red first.
- [ ] Add FastAPI research JSON endpoints and demo CSV, bounded input schemas and tests for successful import and malformed payloads. Preserve deployment scorer and mark legacy synthetic output honestly.
- [ ] Add Next `/research` UI, same-origin API proxy, CSV upload, costs, results, ROC/PR plots, validation thresholds and individual explanations. Verify user workflow and error propagation.
- [ ] Repair full-project reproducible CI: frozen pnpm install, Python pinned dependencies, lint, typecheck, ML/API tests and builds; run each locally as infrastructure permits.
- [ ] Write finance-first README, methodology/data/model docs and observed delivery report. Secret scan, commit/push each tested milestone, verify final GitHub Actions and remote SHA.
