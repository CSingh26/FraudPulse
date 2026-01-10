from fastapi import FastAPI
from pydantic import BaseModel, Field

from .config import settings
from .scoring import score_transaction

app = FastAPI(title='FraudPulse ML Service', version=settings.model_version)


class TransactionPayload(BaseModel):
  amount: float = Field(..., ge=0)
  currency: str
  card_country: str
  merchant_country: str
  merchant_category: str
  channel: str
  entry_mode: str
  ip_country: str | None = None


class FeatureImpactResponse(BaseModel):
  name: str
  impact: float


class ScoreResponse(BaseModel):
  score: float
  label: str
  recommended_action: str
  model_version: str
  top_features: list[FeatureImpactResponse]


@app.get('/health')
def health():
  return {
    'status': 'ok',
    'service': settings.service_name,
    'model_version': settings.model_version,
  }


@app.post('/score', response_model=ScoreResponse)
def score(payload: TransactionPayload):
  result = score_transaction(
    amount=payload.amount,
    channel=payload.channel,
    entry_mode=payload.entry_mode,
    card_country=payload.card_country,
    ip_country=payload.ip_country,
    merchant_country=payload.merchant_country,
    merchant_category=payload.merchant_category,
    threshold=settings.fraud_threshold,
  )

  return ScoreResponse(
    score=result.score,
    label=result.label,
    recommended_action=result.recommended_action,
    model_version=settings.model_version,
    top_features=[
      FeatureImpactResponse(name=feature.name, impact=feature.impact)
      for feature in result.top_features
    ],
  )
