export type Evaluation = {
  threshold: number; precision: number; recall: number; accuracy: number;
  roc_auc: number | null; pr_auc: number | null; average_precision: number | null;
  prevalence: number; flagged: number; cost: number; missed_fraud_amount: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
};
export type ResearchTransaction = {
  transaction_id: string; account_id: string; timestamp: string; amount: number;
  label: number; score: number; flagged: boolean;
  features: Record<string, number>; explanation: { name: string; impact: number }[];
};
export type ResearchResult = {
  threshold: number; test: Evaluation; validation_thresholds: Evaluation[];
  curves: { roc: { x: number; y: number }[]; pr: { x: number; y: number }[] };
  baselines: { allow_all: Evaluation; review_all: Evaluation }; transactions: ResearchTransaction[];
  metadata: { source: string; currency: string; rows: number; sha256: string;
    split_counts: Record<string, number>; periods: Record<string, { start: string; end: string }>;
    limitations: string[] };
};
