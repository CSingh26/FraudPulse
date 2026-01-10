export type ClientOptions = {
  baseUrl: string;
  fetcher?: typeof fetch;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

const defaultFetcher = (...args: Parameters<typeof fetch>) => fetch(...args);

export const createFraudPulseClient = ({ baseUrl, fetcher = defaultFetcher }: ClientOptions) => {
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetcher(`${baseUrl}${path}`, init);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Request failed');
    }
    return (await response.json()) as T;
  };

  return {
    createTransaction: (payload: unknown) =>
      request<{ transactionId: string; jobId: string; queued: boolean }>('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    listAlerts: (query = '') => request<PaginatedResponse<unknown>>(`/alerts${query}`),
    getAlert: (id: string) => request<unknown>(`/alerts/${id}`),
    listTransactions: (query = '') => request<PaginatedResponse<unknown>>(`/transactions${query}`),
    getMetrics: () => request<unknown>('/metrics/overview'),
    getModelInfo: () => request<unknown>('/model'),
  };
};
