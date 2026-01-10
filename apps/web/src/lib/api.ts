import type {
  AlertsResponse,
  MetricsOverview,
  Alert,
  ModelInfo,
  TransactionsResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return (await response.json()) as T;
};

export const fetchMetricsOverview = async (): Promise<MetricsOverview> => {
  const response = await fetch(`${API_URL}/metrics/overview`, {
    cache: 'no-store',
  });
  return handleResponse<MetricsOverview>(response);
};

export const fetchAlerts = async (
  params: Record<string, string | number | undefined>,
): Promise<AlertsResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`${API_URL}/alerts?${query.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<AlertsResponse>(response);
};

export const fetchAlert = async (id: string): Promise<Alert> => {
  const response = await fetch(`${API_URL}/alerts/${id}`, {
    cache: 'no-store',
  });
  return handleResponse<Alert>(response);
};

export const fetchTransactions = async (
  params: Record<string, string | number | undefined>,
): Promise<TransactionsResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`${API_URL}/transactions?${query.toString()}`, {
    cache: 'no-store',
  });
  return handleResponse<TransactionsResponse>(response);
};

export const fetchModelInfo = async (): Promise<ModelInfo> => {
  const response = await fetch(`${API_URL}/model`, { cache: 'no-store' });
  return handleResponse<ModelInfo>(response);
};
