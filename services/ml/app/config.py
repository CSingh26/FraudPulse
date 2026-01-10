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


def load_settings() -> Settings:
  return Settings(
    service_name=os.getenv('SERVICE_NAME', 'fraudpulse-ml'),
    model_version=os.getenv('MODEL_VERSION', 'dummy-v0'),
    fraud_threshold=_get_float(os.getenv('FRAUD_THRESHOLD', '0.7'), 0.7),
  )


settings = load_settings()
