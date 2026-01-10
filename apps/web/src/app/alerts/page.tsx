'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchAlert, fetchAlerts } from '@/lib/api';
import type { Alert, AlertStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusOptions: AlertStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'ESCALATED',
  'RESOLVED',
  'FALSE_POSITIVE',
];

const statusVariant = (status: AlertStatus) => {
  if (status === 'OPEN') return 'warning';
  if (status === 'INVESTIGATING') return 'default';
  if (status === 'ESCALATED') return 'warning';
  if (status === 'RESOLVED') return 'success';
  return 'muted';
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    minScore: '',
    merchant: '',
    cardCountry: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const response = await fetchAlerts({
          status: filters.status || undefined,
          minScore: filters.minScore || undefined,
          merchant: filters.merchant || undefined,
          cardCountry: filters.cardCountry || undefined,
          startDate: filters.startDate ? `${filters.startDate}T00:00:00.000Z` : undefined,
          endDate: filters.endDate ? `${filters.endDate}T23:59:59.000Z` : undefined,
          page: filters.page,
          pageSize: filters.pageSize,
        });

        if (active) {
          setAlerts(response.data);
          setFilters((prev) => ({ ...prev, total: response.total }));
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load alerts');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    filters.status,
    filters.minScore,
    filters.merchant,
    filters.cardCountry,
    filters.startDate,
    filters.endDate,
    filters.page,
    filters.pageSize,
  ]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filters.total / filters.pageSize));
  }, [filters.total, filters.pageSize]);

  const handleSelectAlert = async (alert: Alert) => {
    try {
      const detailed = await fetchAlert(alert.id);
      setSelectedAlert(detailed);
    } catch (err) {
      setSelectedAlert(alert);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Alerts</h3>
        <p className="mt-1 text-sm text-slate-500">
          Live fraud alerts with explanations and response guidance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine the feed by status, score, or merchant.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <Input
              placeholder="Merchant"
              value={filters.merchant}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  merchant: event.target.value,
                  page: 1,
                }))
              }
            />
            <Input
              placeholder="Card country"
              value={filters.cardCountry}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  cardCountry: event.target.value.toUpperCase(),
                  page: 1,
                }))
              }
            />
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value,
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Min score"
              type="number"
              step="0.01"
              value={filters.minScore}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  minScore: event.target.value,
                  page: 1,
                }))
              }
            />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                  page: 1,
                }))
              }
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: event.target.value,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">Auto-refreshes every 5 seconds.</div>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  status: '',
                  minScore: '',
                  merchant: '',
                  cardCountry: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  pageSize: 20,
                  total: filters.total,
                })
              }
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live alerts</CardTitle>
          <CardDescription>
            {loading ? 'Loading alerts…' : `${filters.total} alerts in the current window`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-slate-500">No alerts match these filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    onClick={() => handleSelectAlert(alert)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-900">
                        {alert.transaction.cardId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(alert.transaction.occurredAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">
                        {alert.transaction.merchant.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {alert.transaction.merchant.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-slate-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: alert.transaction.currency,
                        }).format(alert.transaction.amount)}
                      </div>
                      <div className="text-xs text-slate-500">{alert.transaction.cardCountry}</div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {alert.score.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page {filters.page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, prev.page + 1),
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedAlert}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAlert(null);
          }
        }}
      >
        <SheetContent>
          {selectedAlert ? (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Alert detail</SheetTitle>
                <SheetDescription>
                  {selectedAlert.transaction.merchant.name} • {selectedAlert.transaction.cardId}
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-400">Score</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedAlert.score.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Recommended action</p>
                  <p className="font-medium text-slate-900">
                    {selectedAlert.recommendedAction ?? 'Review manually'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Why flagged</p>
                  {selectedAlert.explanation?.topFeatures?.length ? (
                    <ul className="mt-2 space-y-1">
                      {selectedAlert.explanation.topFeatures.map((feature) => (
                        <li key={feature.name} className="flex items-center justify-between">
                          <span className="text-slate-700">{feature.name}</span>
                          <span className="text-slate-500">{feature.impact.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-slate-500">No explanation provided yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Transaction context</h4>
                <div className="mt-2 grid gap-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Channel</span>
                    <span className="font-medium text-slate-900">
                      {selectedAlert.transaction.channel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Entry mode</span>
                    <span className="font-medium text-slate-900">
                      {selectedAlert.transaction.entryMode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IP country</span>
                    <span className="font-medium text-slate-900">
                      {selectedAlert.transaction.ipCountry ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Merchant country</span>
                    <span className="font-medium text-slate-900">
                      {selectedAlert.transaction.merchant.country}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Analyst notes</h4>
                {selectedAlert.notes.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {selectedAlert.notes.map((note) => (
                      <li key={note.id} className="rounded-md border border-slate-200 p-3">
                        <p className="text-xs uppercase text-slate-400">{note.author}</p>
                        <p className="mt-1 text-slate-700">{note.note}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No notes yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
