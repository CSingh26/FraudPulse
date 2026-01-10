from pathlib import Path

from fastapi import FastAPI, Header, HTTPException

from .config import settings
from .model import get_model_metadata, score_with_model
from .scoring import score_transaction
from .schemas import (
  FeatureImpactResponse,
  ModelInfoResponse,
  ScoreResponse,
  TrainRequest,
  TrainResponse,
  TransactionPayload,
)
from .training import train_model

app = FastAPI(title='FraudPulse ML Service', version=settings.model_version)


@app.get('/health')
def health():
  return {
    'status': 'ok',
    'service': settings.service_name,
    'model_version': settings.model_version,
  }


@app.post('/score', response_model=ScoreResponse)
def score(payload: TransactionPayload):
  model_result = score_with_model(payload.model_dump())
  if model_result:
    return ScoreResponse(
      score=model_result['score'],
      label=model_result['label'],
      recommended_action=model_result['recommended_action'],
      model_version=model_result['model_version'],
      top_features=[
        FeatureImpactResponse(**feature) for feature in model_result['top_features']
      ],
    )

  fallback = score_transaction(
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
    score=fallback.score,
    label=fallback.label,
    recommended_action=fallback.recommended_action,
    model_version=settings.model_version,
    top_features=[
      FeatureImpactResponse(name=feature.name, impact=feature.impact)
      for feature in fallback.top_features
    ],
  )


@app.post('/train', response_model=TrainResponse)
def train(request: TrainRequest, x_train_token: str | None = Header(None)):
  if settings.train_token and x_train_token != settings.train_token:
    raise HTTPException(status_code=401, detail='Invalid training token')

  dataset_path = request.dataset_path or settings.dataset_path
  output_dir = Path(settings.model_path).parent

  metadata = train_model(
    dataset_path=dataset_path,
    sample_size=request.sample_size,
    output_dir=output_dir,
    threshold=settings.fraud_threshold,
  )

  return TrainResponse(
    model_version=metadata['model_version'],
    threshold=metadata['threshold'],
    metrics=metadata['metrics'],
    sample_size=metadata['sample_size'],
  )


@app.get('/model', response_model=ModelInfoResponse)
def model_info():
  metadata = get_model_metadata()
  return ModelInfoResponse(
    model_version=metadata.get('model_version', settings.model_version),
    trained_at=metadata.get('trained_at'),
    threshold=metadata.get('threshold', settings.fraud_threshold),
    metrics=metadata.get('metrics', {}),
    confusion_matrix=metadata.get('confusion_matrix'),
    sample_size=metadata.get('sample_size'),
  )
