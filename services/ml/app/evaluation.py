"""Observed decision economics in reporting currency; not estimates of deployable savings."""
import numpy as np
from sklearn.metrics import (auc, average_precision_score, confusion_matrix,
                             precision_recall_curve, roc_auc_score, roc_curve)


def evaluate(labels, scores, amounts, threshold, review_cost, false_positive_cost, loss_fraction):
    y, s, a = np.asarray(labels), np.asarray(scores), np.asarray(amounts)
    flagged = s >= threshold
    tn, fp, fn, tp = confusion_matrix(y, flagged, labels=[0, 1]).ravel()
    missed = float(a[(y == 1) & ~flagged].sum())
    two_classes = len(np.unique(y)) == 2
    precision, recall, _ = precision_recall_curve(y, s) if two_classes else ([], [], [])
    return {
        'threshold': float(threshold), 'confusion_matrix': dict(tn=int(tn), fp=int(fp), fn=int(fn), tp=int(tp)),
        'precision': float(tp / (tp + fp)) if tp + fp else 0.0,
        'recall': float(tp / (tp + fn)) if tp + fn else 0.0,
        'accuracy': float((tp + tn) / len(y)), 'flagged': int(flagged.sum()),
        'prevalence': float(np.mean(y)), 'missed_fraud_amount': missed,
        'cost': float(flagged.sum() * review_cost + fp * false_positive_cost + missed * loss_fraction),
        'roc_auc': float(roc_auc_score(y, s)) if two_classes else None,
        'average_precision': float(average_precision_score(y, s)) if two_classes else None,
        'pr_auc': float(auc(recall, precision)) if two_classes else None,
    }


def select_threshold(labels, scores, amounts, review_cost, false_positive_cost, loss_fraction):
    # Bound work independently of upload size and include explicit review-all/allow-all policies.
    thresholds = np.unique(np.r_[0.0, np.quantile(scores, np.linspace(0, 1, 51)), 1.0000001])
    table = [evaluate(labels, scores, amounts, t, review_cost, false_positive_cost, loss_fraction) for t in thresholds]
    winner = min(table, key=lambda row: (row['cost'], row['flagged'], -row['threshold']))
    return winner['threshold'], table


def curves(labels, scores):
    if len(np.unique(labels)) < 2:
        return {'roc': [], 'pr': []}
    fpr, tpr, _ = roc_curve(labels, scores)
    precision, recall, _ = precision_recall_curve(labels, scores)
    return {'roc': [{'x': float(x), 'y': float(y)} for x, y in zip(fpr, tpr)],
            'pr': [{'x': float(x), 'y': float(y)} for x, y in zip(recall, precision)]}
