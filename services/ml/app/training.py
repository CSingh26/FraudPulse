from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, average_precision_score, confusion_matrix, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .data import load_dataset

CATEGORICAL_FEATURES = [
  'currency',
  'card_country',
  'merchant_country',
  'merchant_category',
  'channel',
  'entry_mode',
  'ip_country',
]
NUMERIC_FEATURES = ['amount', 'hour', 'is_international', 'is_ip_mismatch']
LABEL_COLUMN = 'label'


def _ensure_features(dataset: pd.DataFrame) -> pd.DataFrame:
  required = {'amount', 'currency', 'card_country', 'merchant_country', 'merchant_category', 'channel', 'entry_mode'}
  missing = required - set(dataset.columns)
  if missing:
    raise ValueError(f'Missing required columns: {sorted(missing)}')

  data = dataset.copy()
  if 'ip_country' not in data.columns:
    data['ip_country'] = data['card_country']

  if 'hour' not in data.columns:
    data['hour'] = 12

  data['is_international'] = (data['card_country'] != data['merchant_country']).astype(int)
  data['is_ip_mismatch'] = (data['ip_country'] != data['card_country']).astype(int)

  return data


def build_feature_frame(payload: dict) -> pd.DataFrame:
  data = pd.DataFrame([payload])
  return _ensure_features(data)


def train_model(
  dataset_path: str | None,
  sample_size: int,
  output_dir: Path,
  threshold: float,
) -> dict:
  dataset = load_dataset(dataset_path, sample_size)
  dataset = _ensure_features(dataset)

  if LABEL_COLUMN not in dataset.columns:
    raise ValueError('Dataset must include a label column')

  if 'timestamp' not in dataset:
    raise ValueError('Training CSV requires timestamp for chronological holdout')
  dataset['timestamp'] = pd.to_datetime(dataset.timestamp, utc=True, errors='raise')
  dataset = dataset.sort_values('timestamp').reset_index(drop=True)
  if not dataset.label.isin([0, 1]).all() or not np.isfinite(dataset.amount).all() or (dataset.amount <= 0).any():
    raise ValueError('Invalid labels or amounts')
  times = dataset.timestamp.drop_duplicates().tolist()
  if len(times) < 10:
    raise ValueError('Training needs at least 10 distinct timestamps')
  cutoff = times[int(len(times) * .8)]
  train_mask = dataset.timestamp < cutoff
  X = dataset[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
  y = dataset[LABEL_COLUMN].astype(int)
  X_train, X_test, y_train, y_test = X[train_mask], X[~train_mask], y[train_mask], y[~train_mask]
  if y_train.nunique() < 2 or y_test.nunique() < 2:
    raise ValueError('Training and test periods must contain both classes')

  preprocessor = ColumnTransformer(
    transformers=[
      ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES),
      ('num', StandardScaler(), NUMERIC_FEATURES),
    ],
  )

  classifier = LogisticRegression(max_iter=1000)

  pipeline = Pipeline(
    steps=[
      ('preprocessor', preprocessor),
      ('classifier', classifier),
    ],
  )

  pipeline.fit(X_train, y_train)

  probabilities = pipeline.predict_proba(X_test)[:, 1]
  predictions = (probabilities >= threshold).astype(int)

  metrics = {
    'accuracy': float(accuracy_score(y_test, predictions)),
    'precision': float(precision_score(y_test, predictions, zero_division=0)),
    'recall': float(recall_score(y_test, predictions, zero_division=0)),
    'roc_auc': float(roc_auc_score(y_test, probabilities)),
    'average_precision': float(average_precision_score(y_test, probabilities)),
  }

  tn, fp, fn, tp = confusion_matrix(y_test, predictions).ravel()

  output_dir.mkdir(parents=True, exist_ok=True)
  model_path = output_dir / 'model.joblib'
  metadata_path = output_dir / 'metadata.json'

  model_version = ('csv-' if dataset_path else 'demo-') + datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')
  feature_names = pipeline.named_steps['preprocessor'].get_feature_names_out().tolist()

  metadata = {
    'model_version': model_version,
    'trained_at': datetime.now(timezone.utc).isoformat(),
    'source': 'USER CSV' if dataset_path else 'DEMO DATA',
    'split_method': 'chronological 80/20',
    'threshold': threshold,
    'metrics': metrics,
    'confusion_matrix': {
      'tn': int(tn),
      'fp': int(fp),
      'fn': int(fn),
      'tp': int(tp),
    },
    'sample_size': int(len(dataset)),
    'feature_names': feature_names,
    'categorical_features': CATEGORICAL_FEATURES,
    'numeric_features': NUMERIC_FEATURES,
  }

  joblib.dump(pipeline, model_path)
  metadata_path.write_text(json.dumps(metadata, indent=2))

  return metadata
