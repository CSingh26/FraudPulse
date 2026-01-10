from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
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

  X = dataset[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
  y = dataset[LABEL_COLUMN].astype(int)

  X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
  )

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
  }

  tn, fp, fn, tp = confusion_matrix(y_test, predictions).ravel()

  output_dir.mkdir(parents=True, exist_ok=True)
  model_path = output_dir / 'model.joblib'
  metadata_path = output_dir / 'metadata.json'

  model_version = datetime.utcnow().strftime('%Y%m%d%H%M%S')
  feature_names = pipeline.named_steps['preprocessor'].get_feature_names_out().tolist()

  metadata = {
    'model_version': model_version,
    'trained_at': datetime.utcnow().isoformat() + 'Z',
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
