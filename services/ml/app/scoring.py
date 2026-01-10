from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class FeatureImpact:
  name: str
  impact: float


@dataclass(frozen=True)
class ScoreResult:
  score: float
  label: str
  recommended_action: str
  top_features: List[FeatureImpact]


def score_transaction(
  amount: float,
  channel: str,
  entry_mode: str,
  card_country: str,
  ip_country: str | None,
  merchant_country: str,
  merchant_category: str,
  threshold: float,
) -> ScoreResult:
  impacts: list[FeatureImpact] = []
  score = 0.1

  if amount >= 500:
    score += 0.35
    impacts.append(FeatureImpact('amount', 0.35))
  elif amount >= 200:
    score += 0.2
    impacts.append(FeatureImpact('amount', 0.2))

  if channel.upper() == 'ECOM':
    score += 0.15
    impacts.append(FeatureImpact('channel_ecom', 0.15))

  if entry_mode.upper() == 'MANUAL':
    score += 0.15
    impacts.append(FeatureImpact('entry_mode_manual', 0.15))

  if ip_country and ip_country.upper() != card_country.upper():
    score += 0.18
    impacts.append(FeatureImpact('ip_country_mismatch', 0.18))

  if merchant_country.upper() != card_country.upper():
    score += 0.12
    impacts.append(FeatureImpact('merchant_country_mismatch', 0.12))

  if merchant_category.lower() in {'luxury', 'travel', 'electronics'}:
    score += 0.08
    impacts.append(FeatureImpact('merchant_category', 0.08))

  score = min(score, 0.99)
  label = 'FRAUD' if score >= threshold else 'LEGIT'
  recommended_action = 'REVIEW_AND_BLOCK' if label == 'FRAUD' else 'ALLOW'

  top_features = sorted(impacts, key=lambda item: item.impact, reverse=True)[:3]

  return ScoreResult(
    score=score,
    label=label,
    recommended_action=recommended_action,
    top_features=top_features,
  )
