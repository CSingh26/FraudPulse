import os
from dataclasses import dataclass


def _get_float(value: str, default: float) -> float:
  try:
    return float(value)
  except (TypeError, ValueError):
    return default


@dataclass(frozen=True)
class Settings:
  service_name: str
  model_version: str
  fraud_threshold: float
  model_path: str
  metadata_path: str
  train_token: str | None
  dataset_path: str | None


def load_settings() -> Settings:
  return Settings(
    service_name=os.getenv('SERVICE_NAME', 'fraudpulse-ml'),
    model_version=os.getenv('MODEL_VERSION', 'dummy-v0'),
    fraud_threshold=_get_float(os.getenv('FRAUD_THRESHOLD', '0.7'), 0.7),
    model_path=os.getenv('MODEL_PATH', 'artifacts/model.joblib'),
    metadata_path=os.getenv('METADATA_PATH', 'artifacts/metadata.json'),
    train_token=os.getenv('TRAIN_TOKEN'),
    dataset_path=os.getenv('DATASET_PATH'),
  )


settings = load_settings()
