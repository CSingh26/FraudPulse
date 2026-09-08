"""A reproducible research experiment, isolated from deployed scoring artifacts."""
import hashlib
from datetime import datetime, timezone
from io import StringIO

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .behavior import FEATURES, build_behavior, validate_transactions
from .evaluation import curves, evaluate, select_threshold


def demo_csv():
    rng = np.random.default_rng(42)
    records = []
    for i in range(500):
        account = i % 12
        suspicious = rng.random() < .06
        amount = (20 + account * 15) * rng.lognormal(0, .25) * (5 if suspicious else 1)
        records.append(dict(transaction_id=f'demo-{i:04}', account_id=f'account-{account:02}',
                            timestamp=(pd.Timestamp('2026-01-01T00:00:00Z') + pd.Timedelta(minutes=i * 3)).isoformat(),
                            amount=round(amount, 2), currency='USD',
                            category='electronics' if suspicious else ['food', 'transport'][i % 2],
                            country='GB' if suspicious else 'US',
                            label=int(rng.random() < (.65 if suspicious else .01))))
    return pd.DataFrame(records).to_csv(index=False)


def read_csv(text):
    if len(text.encode('utf-8')) > 2_000_000:
        raise ValueError('CSV exceeds 2 MB')
    try:
        return pd.read_csv(StringIO(text), dtype={'transaction_id': str, 'account_id': str})
    except (pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
        raise ValueError('Unable to parse CSV') from exc


def run_research(raw, review_cost=2.0, false_positive_cost=5.0, loss_fraction=1.0, source='USER CSV'):
    if not all(np.isfinite([review_cost, false_positive_cost, loss_fraction])) or min(review_cost, false_positive_cost) < 0 or not 0 <= loss_fraction <= 1:
        raise ValueError('Costs must be finite and nonnegative; loss_fraction must be between 0 and 1')
    data = validate_transactions(raw)
    timestamps = data.timestamp.drop_duplicates().tolist()
    if len(data) < 50 or len(timestamps) < 10:
        raise ValueError('Research requires at least 50 rows and 10 distinct timestamps')
    train_end, validation_end = timestamps[int(len(timestamps) * .6)], timestamps[int(len(timestamps) * .8)]
    masks = {'train': data.timestamp < train_end,
             'validation': (data.timestamp >= train_end) & (data.timestamp < validation_end),
             'test': data.timestamp >= validation_end}
    if data.loc[masks['train'], 'label'].nunique() != 2:
        raise ValueError('Training period must contain both classes')
    if data.loc[masks['validation'], 'label'].nunique() != 2:
        raise ValueError('Validation period must contain both classes for threshold selection')
    features = build_behavior(data)
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, random_state=42))
    model.fit(features.loc[masks['train'], FEATURES], data.loc[masks['train'], 'label'])
    scores = model.predict_proba(features[FEATURES])[:, 1]
    def inputs(mask):
        return data.loc[mask, 'label'], scores[mask], data.loc[mask, 'amount']
    threshold, table = select_threshold(*inputs(masks['validation']), review_cost, false_positive_cost, loss_fraction)
    test = evaluate(*inputs(masks['test']), threshold, review_cost, false_positive_cost, loss_fraction)
    classifier = model.named_steps['logisticregression']
    transformed = model.named_steps['standardscaler'].transform(features[FEATURES])
    impacts = transformed * classifier.coef_[0]
    intercept = float(classifier.intercept_[0])
    transactions = []
    for i in data.index[masks['test']]:
        row = data.loc[i]
        transactions.append({
            'transaction_id': row.transaction_id, 'account_id': row.account_id,
            'timestamp': row.timestamp.isoformat(), 'amount': float(row.amount), 'label': int(row.label),
            'score': float(scores[i]), 'flagged': bool(scores[i] >= threshold),
            'features': {k: float(v) for k, v in features.loc[i].items()},
            'intercept': intercept, 'log_odds': float(intercept + impacts[i].sum()),
            'explanation': sorted([{'name': name, 'impact': float(value)} for name, value in zip(FEATURES, impacts[i])],
                                  key=lambda x: abs(x['impact']), reverse=True),
        })
    periods = {name: {'start': data.loc[mask, 'timestamp'].min().isoformat(),
                       'end': data.loc[mask, 'timestamp'].max().isoformat()} for name, mask in masks.items()}
    return {
        'threshold': threshold, 'test': test, 'validation_thresholds': table,
        'curves': curves(data.loc[masks['test'], 'label'], scores[masks['test']]),
        'baselines': {name: evaluate(*inputs(masks['test']), t, review_cost, false_positive_cost, loss_fraction)
                      for name, t in [('allow_all', 1.0000001), ('review_all', 0)]},
        'coefficients': dict(zip(FEATURES, classifier.coef_[0].tolist())),
        'transactions': sorted(transactions, key=lambda x: x['score'], reverse=True),
        'metadata': {'source': source, 'currency': data.currency.iloc[0], 'rows': len(data),
                     'sha256': hashlib.sha256(data.to_csv(index=False).encode()).hexdigest(),
                     'retrieved_at': datetime.now(timezone.utc).isoformat(),
                     'split_counts': {name: int(mask.sum()) for name, mask in masks.items()},
                     'periods': periods, 'features': FEATURES, 'seed': 42,
                     'cost_assumptions': dict(review_cost=review_cost, false_positive_cost=false_positive_cost, loss_fraction=loss_fraction),
                     'limitations': ['Research scores are not calibrated fraud probabilities.',
                                     'Labels must already be settled by each fitting or selection cutoff; CSV cannot verify their availability.',
                                     'Test outcomes may guide future research but must not tune this experiment.',
                                     'UTC hours and country changes are behavioral signals, not proof of fraud.',
                                     'Simulation performance does not establish effectiveness on real transactions.']},
    }
