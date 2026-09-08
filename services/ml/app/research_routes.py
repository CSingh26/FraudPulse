from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, ConfigDict, Field

from .research import demo_csv, read_csv, run_research

router = APIRouter(prefix='/research', tags=['research'])


class CostScenario(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    review_cost: float = Field(2, ge=0, le=1000000)
    false_positive_cost: float = Field(5, ge=0, le=1000000)
    loss_fraction: float = Field(1, ge=0, le=1)


class ResearchRequest(CostScenario):
    csv: str = Field(min_length=1, max_length=2000000)


def analyze_csv(csv, scenario, source):
    try:
        return run_research(read_csv(csv), **scenario, source=source)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get('/demo', response_class=PlainTextResponse)
def download_demo():
    return PlainTextResponse(demo_csv(), media_type='text/csv',
                             headers={'Content-Disposition': 'attachment; filename="fraudpulse-demo.csv"'})


@router.post('/demo')
def analyze_demo(request: CostScenario):
    return analyze_csv(demo_csv(), request.model_dump(), 'DEMO DATA — synthetic seed 42')


@router.post('/analyze')
def analyze_upload(request: ResearchRequest):
    return analyze_csv(request.csv, request.model_dump(exclude={'csv'}), 'USER CSV')
