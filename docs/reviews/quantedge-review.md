# Independent QuantEdge workbench review

Reviewer: FraudPulse project lead, read-only review of QuantEdge. Scope: intelligence schemas, SEC/risk/valuation/service modules, endpoint, available test fixtures; 2026-09-08. Reviewed current working files, not a frozen release. Frontend implementation was not yet present at review time; frontend test specification is present.

## Finding P2 — 10-Q section extraction conflates Part I and Part II Item 2

`quantedge/backend/app/services/intelligence/sec.py:120`–130 indexes sections only by item number and chooses the longest repeat. A 10-Q has Part I Item 2 (MD&A) and Part II Item 2 (Unregistered Sales of Equity Securities and Use of Proceeds). If the latter is longer, it replaces the MD&A result. Reproduced directly with `extract_sections(text, '10-Q')`: short Part I MD&A followed by longer Part II Item 2 returns `Item 2. Unregistered Sales of Equity Securities` under `mda`. The source-review warning does not make this classification correct. Track Part boundaries and only select Part I Item 2; risk factors belong to Part II Item 1A. Add a fixture containing both parts, with the wrong section deliberately longer.

## Methodology assessment

WACC weighting and debt tax shield, FCFF reinvestment, EV-to-equity bridge, sustainable terminal-year working capital, simple return calculations, sample covariance, benchmark beta, arithmetic alpha annualization, and all-observation downside deviation are internally coherent. Supplied schemas bound finite inputs and dates. Trainable ML is not introduced here. SEC facts require exact duration, accession and filing timestamp matching; missing comparisons are reported unavailable rather than fabricated. This conservatism can suppress prior-year figures for 52/53-week fiscal calendars because comparative boundaries use calendar-year subtraction; document that limitation and consider deriving comparative fiscal periods from filing contexts later.

## Engineering, security, and portfolio assessment

The endpoint applies existing expensive-route authentication/quota dependencies and catches invalid analytical contexts. No credential handling or arbitrary fetch execution was introduced in reviewed modules. Imported filing text is explicitly unverified; imported ticker/CIK/text identity remains user assertions. Risk frequency and adjustment completeness are also explicitly user assertions. Backend formulas have meaningful hand-calculated tests. The frontend tests specify stale-result clearing, honest errors and conclusions preceding evidence, but its implementation and full CI were still in progress, so this review does not certify those. No other blocking defect established in the reviewed backend scope.
