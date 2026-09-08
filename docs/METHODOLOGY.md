# Behavioral fraud methodology

FraudPulse separates an operational alerting prototype from an independently evaluated behavioral research workspace. A high score means investigate, not that a transaction is proven fraudulent.

## Point-in-time behavioral evidence
For transaction t, account history contains only observations strictly earlier than t, within the preceding 30 days (inclusive boundary). Equal-timestamp batches are all scored before any enters history. IDs break output ties only. Histories never include labels. Account identifiers isolate customers; the pipeline sorts timestamps in UTC.

- **Amount deviation:** current amount / prior 30-day mean − 1, clipped to [−1,20]. A 80-unit purchase against a 20-unit mean yields 3, or 300% above baseline. Cold starts return zero deviation with an explicit cold-start feature.
- **Velocity:** number of strictly earlier transactions in the preceding hour, inclusive lower boundary.
- **Category novelty:** 1 when a category has not appeared in the prior 30 days, provided history exists.
- **Country switch:** 1 when the country differs from the last prior transaction. This is not impossible-travel detection; no coordinates or travel times are inferred.
- **UTC-hour novelty:** 1 when that UTC hour has not appeared in prior history. It is not a customer's local hour.
- **Cold start:** explicitly marks missing behavioral history. No population amount baseline is substituted.

Only these six behavioral features enter logistic regression. Raw amount, IDs, labels and timestamp are excluded. Amount influences investigation economics independently. Scaling is fit on training rows only. The prior-history mean/count are also returned as human-readable evidence.

## Chronology and label availability
Whole timestamp groups are assigned approximately 60% training, 20% validation and 20% test. Fractions apply to distinct timestamps; unequal groups can produce unequal row proportions. Logistic regression fits only the training set; validation selects the operating threshold. Future unlabeled transaction attributes can update later behavior, just as sequential observation would, but cannot alter earlier features. A regression test mutates all test labels and verifies identical model coefficients and threshold.

Labels must be settled and available by the applicable training/validation cutoffs. The current CSV schema cannot independently verify label availability dates. Therefore this is chronological retrospective research, not a claim of fully point-in-time deployment performance. Delayed fraud discovery, reversals, selective observation and chargeback maturity need a production label pipeline. Training and validation each require both classes; one-class test ranking metrics are returned as null.

## Threshold economics
All amounts and costs share one reporting currency; mixed-currency files are rejected without implicit FX conversion.

`cost = review_cost × number_flagged + false_positive_cost × FP + loss_fraction × sum(amount of FN)`

Review cost applies to all flagged transactions. False-positive friction is an additional cost for legitimate transactions reviewed. Missed loss is exposure multiplied by a [0,1] loss fraction. This scenario assumes successful review prevents all loss on detected fraud and excludes fixed platform cost, partial recovery, review errors, delays and constrained investigator capacity. No realized savings claim follows from it.

Up to 53 validation thresholds span review-all, 51 score quantiles, and allow-all. Minimum cost wins; ties prefer fewer reviews, then a higher threshold. This bounded grid is transparent and reproducible but can miss an optimum between quantiles. The selected threshold is frozen for test reporting. Always-allow and always-review test baselines use identical costs.

## Metrics and explanation
Precision = TP/(TP+FP), recall = TP/(TP+FN). Undefined decision ratios are null; confusion counts remain visible. Accuracy is secondary: if 1% of transactions are fraud, always allowing achieves 99% accuracy while missing every fraud loss.

ROC-AUC measures rank discrimination across both classes. PR-AUC uses trapezoidal integration of precision versus recall; **average precision** uses recall increments as weights and is separately reported. Under imbalance, precision/recall and class prevalence reveal investigation usefulness more directly than accuracy. Neither ranking metric establishes calibrated probabilities.

For each test transaction, standardized feature × fitted coefficient gives a signed log-odds contribution. All contributions plus the intercept reconstruct the logistic score, verified by tests. These are model associations, not causal evidence or probability percentage points.

Primary references: [scikit-learn average precision](https://scikit-learn.org/1.5/modules/generated/sklearn.metrics.average_precision_score.html), [classification threshold tuning](https://scikit-learn.org/stable/modules/classification_threshold.html). API definitions were checked on 2026-09-08.
