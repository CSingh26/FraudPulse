"""Point-in-time account behavior; labels never enter feature construction."""
from collections import defaultdict, deque

import numpy as np
import pandas as pd

FEATURES = ['amount_deviation', 'velocity_1h', 'category_novelty',
            'country_switch', 'hour_novelty', 'cold_start']
REQUIRED = ['transaction_id', 'account_id', 'timestamp', 'amount', 'currency',
            'category', 'country', 'label']


def validate_transactions(data: pd.DataFrame) -> pd.DataFrame:
    missing = set(REQUIRED) - set(data.columns)
    if missing:
        raise ValueError(f'Missing columns: {sorted(missing)}')
    if not 1 <= len(data) <= 10000:
        raise ValueError('Provide between 1 and 10000 transactions')
    result = data[REQUIRED].copy()
    for field in ['transaction_id', 'account_id', 'currency', 'category', 'country']:
        if result[field].isna().any() or result[field].astype(str).str.strip().eq('').any():
            raise ValueError(f'{field} must contain nonempty values')
        result[field] = result[field].astype(str).str.strip()
        if result[field].str.len().gt(100).any():
            raise ValueError(f'{field} exceeds 100 characters')
    if result.transaction_id.duplicated().any():
        raise ValueError('Duplicate transaction_id')
    if result.currency.nunique() != 1 or not result.currency.str.fullmatch('[A-Z]{3}').all():
        raise ValueError('Use one reporting currency with a three-letter uppercase code')
    if not result.country.str.fullmatch('[A-Z]{2}').all():
        raise ValueError('country must be a two-letter uppercase code')
    for field in ['amount', 'label']:
        result[field] = pd.to_numeric(result[field], errors='coerce')
        if not np.isfinite(result[field]).all():
            raise ValueError(f'{field} must be finite numeric values')
    if (result.amount <= 0).any() or (result.amount > 1e9).any():
        raise ValueError('amount must be positive and at most 1 billion reporting currency units')
    if not result.label.isin([0, 1]).all():
        raise ValueError('label must be 0 (legitimate) or 1 (settled fraud)')
    timestamps = result.timestamp.astype(str)
    if not timestamps.str.contains(r'T.*(?:Z|[+-]\d{2}:\d{2})$', regex=True).all():
        raise ValueError('timestamp must be ISO 8601 with explicit timezone')
    result['timestamp'] = pd.to_datetime(timestamps, utc=True, errors='coerce', format='mixed')
    if result.timestamp.isna().any():
        raise ValueError('Invalid timestamp')
    return result.sort_values(['timestamp', 'transaction_id'], kind='stable').reset_index(drop=True)


def build_behavior(data: pd.DataFrame) -> pd.DataFrame:
    history = defaultdict(deque)
    output = []
    for timestamp, group in data.groupby('timestamp', sort=False):
        for row in group.itertuples():
            prior = history[row.account_id]
            while prior and timestamp - prior[0].timestamp > pd.Timedelta(days=30):
                prior.popleft()
            mean = float(np.mean([p.amount for p in prior])) if prior else 0.0
            output.append({
                'history_count': len(prior), 'prior_mean_amount': mean,
                # Ratio measures departure from the account's own spend scale, not an arbitrary dollar cutoff.
                'amount_deviation': min(20.0, max(-1.0, row.amount / mean - 1)) if prior else 0.0,
                'velocity_1h': sum(timestamp - p.timestamp <= pd.Timedelta(hours=1) for p in prior),
                'category_novelty': int(bool(prior) and row.category not in {p.category for p in prior}),
                'country_switch': int(bool(prior) and row.country != prior[-1].country),
                'hour_novelty': int(bool(prior) and timestamp.hour not in {p.timestamp.hour for p in prior}),
                'cold_start': int(not prior),
            })
        # Simultaneous transactions must not reveal each other to their features.
        for row in group.itertuples():
            history[row.account_id].append(row)
    return pd.DataFrame(output)
