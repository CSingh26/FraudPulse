# Transaction research CSV

UTF-8 CSV, at most 2 MB and 10,000 rows; at least 50 rows and 10 distinct timestamps for analysis.

| Column | Meaning / validation |
|---|---|
| transaction_id | Unique nonempty identifier; treated as text, max 100 characters |
| account_id | Stable pseudonymous account identifier, max 100 characters |
| timestamp | ISO 8601 timestamp with explicit timezone; normalized to UTC |
| amount | Positive finite reporting-currency units, maximum 1 billion; no implicit minor-unit conversion |
| currency | One uppercase three-letter currency code per file; code syntax validated, not a complete ISO registry |
| category | Nonempty merchant category, max 100 characters; user taxonomy preserved |
| country | Two uppercase letters; location category, not coordinates |
| label | 0 legitimate, 1 settled fraud; no fractional/missing labels |

Unexpected columns are excluded from calculations. Label maturity must be established upstream. Currency amounts should be converted using a documented point-in-time FX process before import if original transactions span currencies. No credit card PAN, personal names or private credentials are needed.

Research results contain canonical input SHA-256, source label, UTC calculation time, periods, row counts, seed and cost assumptions. Files and model artifacts are not persisted by the research endpoint. Browser state contains the results; operational ingestion separately persists transactions in PostgreSQL.

`GET /research/demo` supplies deterministic synthetic seed-42 fixture bytes; `POST /research/demo` explicitly labels results DEMO DATA. Uploading any CSV labels it USER CSV, which identifies input provenance and does not authenticate the values. Failures return an error and do not substitute synthetic observations.
