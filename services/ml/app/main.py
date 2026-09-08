import logging
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import settings
from .research_routes import router as research_router
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
logger = logging.getLogger(__name__)
app.include_router(research_router)

@app.exception_handler(RequestValidationError)
async def validation_error(_request, exc):
  # Invalid nonfinite inputs cannot safely be echoed by JSON error serialization.
  detail = [{'location': '.'.join(map(str, error['loc'])), 'message': error['msg']}
            for error in exc.errors()]
  return JSONResponse({'detail': detail}, status_code=422)



def _artifacts_exist() -> bool:
  model_path = Path(settings.model_path)
  metadata_path = Path(settings.metadata_path)
  return model_path.exists() and metadata_path.exists()


@app.on_event('startup')
def warm_start_model():
  if not settings.auto_train_on_startup:
    return

  if _artifacts_exist():
    return

  try:
    output_dir = Path(settings.model_path).parent
    train_model(
      dataset_path=settings.dataset_path,
      sample_size=settings.auto_train_sample_size,
      output_dir=output_dir,
      threshold=settings.fraud_threshold,
    )
    logger.info('Auto-trained model artifacts for local startup.')
  except Exception:
    logger.exception('Auto-training failed. Falling back to heuristic scorer.')


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
