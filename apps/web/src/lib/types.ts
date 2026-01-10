export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';

export type Merchant = {
  id: string;
  name: string;
  category: string;
  country: string;
};

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  cardId: string;
  cardCountry: string;
  channel: string;
  entryMode: string;
  ipCountry?: string | null;
  deviceId?: string | null;
  occurredAt: string;
  merchant: Merchant;
};

export type InvestigationNote = {
  id: string;
  author: string;
  note: string;
  createdAt: string;
};

export type Alert = {
  id: string;
  transactionId: string;
  score: number;
  label: 'FRAUD' | 'LEGIT';
  status: AlertStatus;
  explanation?: {
    topFeatures?: Array<{ name: string; impact: number }>;
    modelVersion?: string;
  } | null;
  recommendedAction?: string | null;
  createdAt: string;
  updatedAt: string;
  transaction: Transaction;
  notes: InvestigationNote[];
};

export type AlertsResponse = {
  data: Alert[];
  page: number;
  pageSize: number;
  total: number;
};

export type MetricsOverview = {
  fraudRateSeries: Array<{
    date: string;
    total: number;
    fraud: number;
    fraudRate: number;
  }>;
  statusCounts: Array<{ status: AlertStatus; count: number }>;
  avgScore: number;
  topMerchants: Array<{
    merchantId: string;
    merchantName: string;
    alertCount: number;
    avgScore: number;
  }>;
};
