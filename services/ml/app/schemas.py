from pydantic import BaseModel, Field


class TransactionPayload(BaseModel):
  amount: float = Field(..., ge=0)
  currency: str
  card_country: str
  merchant_country: str
  merchant_category: str
  channel: str
  entry_mode: str
  ip_country: str | None = None
  timestamp: str | None = None


class FeatureImpactResponse(BaseModel):
  name: str
  impact: float


class ScoreResponse(BaseModel):
  score: float
  label: str
  recommended_action: str
  model_version: str
  top_features: list[FeatureImpactResponse]


class TrainRequest(BaseModel):
  dataset_path: str | None = None
  sample_size: int = Field(5000, ge=100)


class TrainResponse(BaseModel):
  model_version: str
  threshold: float
  metrics: dict[str, float]
  sample_size: int


class ModelInfoResponse(BaseModel):
  model_version: str
  trained_at: str | None
  threshold: float
  metrics: dict[str, float]
  confusion_matrix: dict[str, int] | None
  sample_size: int | None
