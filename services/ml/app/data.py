from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd

COUNTRIES = ['US', 'GB', 'CA', 'DE', 'FR', 'AE', 'SG', 'BR', 'IN', 'NG']
CURRENCY_BY_COUNTRY = {
  'US': 'USD',
  'GB': 'GBP',
  'CA': 'CAD',
  'DE': 'EUR',
  'FR': 'EUR',
  'AE': 'AED',
  'SG': 'SGD',
  'BR': 'BRL',
  'IN': 'INR',
  'NG': 'NGN',
}
MERCHANT_CATEGORIES = [
  'grocery',
  'apparel',
  'electronics',
  'travel',
  'luxury',
  'gaming',
  'utilities',
]
CHANNELS = ['POS', 'ECOM', 'ATM']
ENTRY_MODES = ['CHIP', 'SWIPE', 'MANUAL']


def _choose(rng: np.random.Generator, values: Iterable[str], size: int, p=None) -> np.ndarray:
  return rng.choice(np.array(list(values)), size=size, p=p)


def generate_synthetic_dataset(sample_size: int = 5000, seed: int = 42) -> pd.DataFrame:
  rng = np.random.default_rng(seed)

  card_country = _choose(rng, COUNTRIES, sample_size)
  merchant_country = card_country.copy()
  mismatch_mask = rng.random(sample_size) < 0.18
  merchant_country[mismatch_mask] = _choose(rng, COUNTRIES, mismatch_mask.sum())

  channel = _choose(rng, CHANNELS, sample_size, p=[0.6, 0.3, 0.1])
  entry_mode = _choose(rng, ENTRY_MODES, sample_size, p=[0.5, 0.35, 0.15])
  merchant_category = _choose(rng, MERCHANT_CATEGORIES, sample_size)

  ip_country = card_country.copy()
  ip_mismatch_mask = (channel == 'ECOM') & (rng.random(sample_size) < 0.35)
  ip_country[ip_mismatch_mask] = _choose(rng, COUNTRIES, ip_mismatch_mask.sum())

  amount = rng.lognormal(mean=3.2, sigma=0.9, size=sample_size) * 15
  amount = np.clip(amount, 5, 5000)
  hour = rng.integers(0, 24, size=sample_size)

  is_international = card_country != merchant_country
  is_ip_mismatch = ip_country != card_country
  high_risk_category = np.isin(merchant_category, ['electronics', 'travel', 'luxury'])

  risk_score = (
    -3.0
    + 0.0035 * amount
    + 1.0 * is_international
    + 0.9 * is_ip_mismatch
    + 0.7 * (channel == 'ECOM')
    + 0.6 * (entry_mode == 'MANUAL')
    + 0.5 * high_risk_category
  )
  probability = 1 / (1 + np.exp(-risk_score))
  label = rng.binomial(1, probability)

  currency = np.vectorize(lambda country: CURRENCY_BY_COUNTRY.get(country, 'USD'))(card_country)

  return pd.DataFrame(
    {
      'timestamp': pd.date_range('2025-01-01', periods=sample_size, freq='min', tz='UTC').astype(str),
      'amount': amount,
      'currency': currency,
      'card_country': card_country,
      'merchant_country': merchant_country,
      'merchant_category': merchant_category,
      'channel': channel,
      'entry_mode': entry_mode,
      'ip_country': ip_country,
      'hour': hour,
      'is_international': is_international.astype(int),
      'is_ip_mismatch': is_ip_mismatch.astype(int),
      'label': label,
    },
  )


def load_dataset(path: str | None, sample_size: int) -> pd.DataFrame:
  if path:
    dataset = pd.read_csv(path)
    if 'label' not in dataset.columns:
      if 'is_fraud' in dataset.columns:
        dataset = dataset.rename(columns={'is_fraud': 'label'})
      else:
        raise ValueError('Dataset must include a label or is_fraud column')
    return dataset

  return generate_synthetic_dataset(sample_size=sample_size)
