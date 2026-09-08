import unittest

import numpy as np
import pandas as pd

from app.behavior import build_behavior, validate_transactions
from app.evaluation import evaluate, select_threshold


def rows():
    return pd.DataFrame([
        dict(transaction_id=str(i), account_id='a', timestamp=t, amount=a,
             currency='USD', category=c, country='US', label=i % 2)
        for i, (t, a, c) in enumerate([
            ('2026-01-01T10:00:00Z', 10, 'food'),
            ('2026-01-01T10:20:00Z', 30, 'food'),
            ('2026-01-01T10:40:00Z', 80, 'travel'),
            ('2026-01-01T10:40:00Z', 90, 'travel'),
        ])
    ])


class BehaviorTests(unittest.TestCase):
    def test_prior_only_rolling_features_and_ties(self):
        features = build_behavior(validate_transactions(rows()))
        self.assertEqual(features.iloc[0].history_count, 0)
        self.assertEqual(features.iloc[2].velocity_1h, 2)
        self.assertEqual(features.iloc[2].prior_mean_amount, 20)
        self.assertAlmostEqual(features.iloc[2].amount_deviation, 3)
        self.assertEqual(features.iloc[2].category_novelty, 1)
        self.assertEqual(features.iloc[3].history_count, 2)

    def test_future_changes_do_not_change_past(self):
        original = rows()
        changed = original.copy()
        changed.loc[3, 'amount'] = 9000
        pd.testing.assert_frame_equal(build_behavior(validate_transactions(original)).iloc[:3],
                                      build_behavior(validate_transactions(changed)).iloc[:3])

    def test_account_isolation_and_window_expiry(self):
        data = rows()
        data.loc[1, 'account_id'] = 'b'
        data.loc[2, 'timestamp'] = '2026-03-01T10:00:00Z'
        features = build_behavior(validate_transactions(data))
        self.assertEqual(features.iloc[1].history_count, 0)
        self.assertEqual(features.iloc[-1].history_count, 0)

    def test_invalid_data(self):
        for field, value in [('amount', np.inf), ('amount', -1), ('amount', 0),
                             ('timestamp', '2026-01-01'), ('timestamp', 'not a date'),
                             ('label', 0.5), ('account_id', ''), ('country', None)]:
            with self.subTest(field=field, value=value):
                data = rows().astype(object)
                data.loc[0, field] = value
                with self.assertRaises(ValueError):
                    validate_transactions(data)
        for field, value in [('currency', 'EUR'), ('transaction_id', '1')]:
            data = rows()
            data.loc[0, field] = value
            with self.assertRaises(ValueError):
                validate_transactions(data)


class EvaluationTests(unittest.TestCase):
    def test_hand_calculated_metrics_and_cost(self):
        result = evaluate([0, 0, 1, 1], [.1, .4, .35, .8], [10, 20, 100, 200], .4, 2, 5, .5)
        self.assertEqual(result['confusion_matrix'], dict(tn=1, fp=1, fn=1, tp=1))
        self.assertEqual(result['precision'], .5)
        self.assertEqual(result['recall'], .5)
        self.assertEqual(result['cost'], 59)  # two reviews (4), one false alarm (5), missed loss (50)
        self.assertAlmostEqual(result['roc_auc'], .75)
        self.assertAlmostEqual(result['average_precision'], 5 / 6)
        self.assertEqual(result['missed_fraud_amount'], 100)

    def test_threshold_can_choose_allow_all(self):
        threshold, table = select_threshold([0, 1], [.2, .8], [10, 1], 100, 5, 1)
        self.assertGreater(threshold, .8)
        self.assertEqual(min(x['cost'] for x in table), 1)

    def test_one_class_metrics_are_undefined_not_perfect(self):
        result = evaluate([0, 0], [.1, .3], [10, 20], .5, 1, 1, 1)
        self.assertIsNone(result['roc_auc'])
        self.assertIsNone(result['average_precision'])

class ResearchTests(unittest.TestCase):
    def test_chronological_reproducibility_and_no_test_label_leakage(self):
        from app.research import run_research, demo_csv
        from io import StringIO
        data = pd.read_csv(StringIO(demo_csv()))
        result = run_research(data, 2, 5, .8, 'USER CSV')
        changed = data.copy()
        changed.loc[changed.index >= 400, 'label'] = 1 - changed.loc[changed.index >= 400, 'label']
        other = run_research(changed, 2, 5, .8, 'USER CSV')
        self.assertEqual(result['threshold'], other['threshold'])
        self.assertEqual(result['coefficients'], other['coefficients'])
        self.assertEqual(result['metadata']['split_counts'], dict(train=300, validation=100, test=100))
        self.assertLess(result['metadata']['periods']['train']['end'], result['metadata']['periods']['validation']['start'])
        self.assertEqual(result['metadata']['sha256'], run_research(data, 2, 5, .8, 'USER CSV')['metadata']['sha256'])
        for row in result['transactions']:
            reconstructed = 1 / (1 + np.exp(-row['log_odds']))
            self.assertAlmostEqual(reconstructed, row['score'])
            self.assertAlmostEqual(sum(x['impact'] for x in row['explanation']) + row['intercept'], row['log_odds'])

    def test_rejects_degenerate_training_and_invalid_costs(self):
        from app.research import run_research, demo_csv
        from io import StringIO
        data = pd.read_csv(StringIO(demo_csv()))
        for costs in [(-1, 5, 1), (1, np.nan, 1), (1, 5, 1.1)]:
            with self.assertRaises(ValueError):
                run_research(data, *costs)
        data['label'] = 0
        with self.assertRaisesRegex(ValueError, 'both classes'):
            run_research(data, 1, 5, 1)

class UndefinedRatioTests(unittest.TestCase):
    def test_no_flags_precision_is_undefined(self):
        self.assertIsNone(evaluate([0, 1], [.1, .2], [1, 2], .5, 1, 1, 1)['precision'])

    def test_no_fraud_recall_is_undefined(self):
        self.assertIsNone(evaluate([0, 0], [.1, .2], [1, 2], .5, 1, 1, 1)['recall'])
