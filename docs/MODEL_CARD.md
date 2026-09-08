# Behavioral logistic model card

Purpose: analyst research into investigation economics under transaction class imbalance. The six input features represent prior account behavior. StandardScaler and L2 logistic regression (scikit-learn, seed 42, maximum 1,000 iterations) are fitted per request without modifying deployed artifacts.

Intended use: compare retrospective policies, inspect mistakes and propose questions for validated financial systems. Excluded use: autonomous blocking, legal accusations, deployment-grade fraud probability estimates or business savings forecasts.

Data: user-imported labeled CSV or prominently identified deterministic synthetic fixture. No genuine bank/customer dataset or external performance benchmark is bundled. Synthetic labels are generated partly from injected atypical behavior with label noise; synthetic results demonstrate software behavior, not generalization.

Evaluation: chronological train/validation/test groups, no shuffled splitting, train-only preprocessing, cost-selected validation threshold, untouched test metrics, allow/review baselines. No fitted calibration, walk-forward model monitoring or confidence intervals. Rare events and short histories produce unstable results. Account geography may correlate with sensitive context; country transitions are investigation clues, not reasons for discriminatory decisions.

Separate operational scorer: the historical `/score` service remains an amount/category logistic prototype, with optional explicit heuristic fallback. Its synthetic artifact versions begin `demo-`; training now uses chronological 80/20 holdout. It does not share research behavioral state and must not be described as the validated research model. Research does not deploy or auto-replace it.

Production gaps: authenticated access, quotas/body limits at ingress, durable event-time feature state, late-event policy, identity and label-maturity verification, calibration, reviewer-capacity constraints, adversarial adaptation, human review outcomes, privacy retention, monitoring and model approval.
