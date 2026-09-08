from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib

from .config import settings
from .training import build_feature_frame

_model_cache: Any | None = None
_metadata_cache: dict | None = None


def _load_metadata(metadata_path: Path) -> dict | None:
  if not metadata_path.exists():
    return None
  return json.loads(metadata_path.read_text())


def load_artifacts() -> tuple[Any | None, dict | None]:
  global _model_cache, _metadata_cache

  model_path = Path(settings.model_path)
  metadata_path = Path(settings.metadata_path)

  if _model_cache is None and model_path.exists():
    _model_cache = joblib.load(model_path)

  if _metadata_cache is None and metadata_path.exists():
    _metadata_cache = _load_metadata(metadata_path)

  return _model_cache, _metadata_cache


def _compute_feature_impacts(model, features) -> list[dict]:
  preprocessor = model.named_steps['preprocessor']
  classifier = model.named_steps['classifier']

  if not hasattr(classifier, 'coef_'):
    return []

  transformed = preprocessor.transform(features)
  values = transformed.toarray()[0] if hasattr(transformed, 'toarray') else transformed[0]
  coefs = classifier.coef_[0]
  contributions = values * coefs

  feature_names = preprocessor.get_feature_names_out()
  impact_pairs = list(zip(feature_names, contributions))
  impact_pairs.sort(key=lambda item: abs(item[1]), reverse=True)

  return [
    {'name': name, 'impact': float(impact)}
    for name, impact in impact_pairs[:3]
  ]


def score_with_model(payload: dict) -> dict | None:
  model, metadata = load_artifacts()
  if model is None:
    return None

  features = build_feature_frame(payload)
  probability = float(model.predict_proba(features)[0, 1])

  threshold = settings.fraud_threshold
  model_version = settings.model_version
  if metadata:
    threshold = float(metadata.get('threshold', threshold))
    model_version = metadata.get('model_version', model_version)

  label = 'FRAUD' if probability >= threshold else 'LEGIT'
  recommended_action = 'REVIEW_AND_BLOCK' if label == 'FRAUD' else 'ALLOW'

  return {
    'score': probability,
    'label': label,
    'recommended_action': recommended_action,
    'top_features': _compute_feature_impacts(model, features),
    'model_version': model_version,
  }


def get_model_metadata() -> dict:
  _, metadata = load_artifacts()
  if metadata:
    return metadata

  return {
    'model_version': settings.model_version,
    'trained_at': None,
    'threshold': settings.fraud_threshold,
    'metrics': {},
    'confusion_matrix': None,
    'sample_size': None,
  }
