'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { fetchMetricsOverview } from '@/lib/api';
import type { MetricsOverview } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const response = await fetchMetricsOverview();
        if (active) {
          setMetrics(response);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const kpis = useMemo(() => {
    if (!metrics) {
      return {
        activeAlerts: 0,
        fraudRate: 0,
        avgScore: 0,
      };
    }

    const activeAlerts = metrics.statusCounts
      .filter((item) => ['OPEN', 'INVESTIGATING', 'ESCALATED'].includes(item.status))
      .reduce((sum, item) => sum + item.count, 0);

    const latest = metrics.fraudRateSeries[metrics.fraudRateSeries.length - 1];

    return {
      activeAlerts,
      fraudRate: latest?.fraudRate ?? 0,
      avgScore: metrics.avgScore,
    };
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Overview</h3>
        <p className="mt-1 text-sm text-slate-500">
          Operational model flags and investigation activity. Flags are not confirmed fraud.
        </p>
      </div>

      <Link href="/research" className="block rounded border border-teal-200 bg-teal-50 p-4 text-teal-800">Explore behavioral research → Upload transactions, investigate alerts, and compare review costs with missed fraud exposure.</Link>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-rose-600">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Active alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {loading || !metrics ? '—' : kpis.activeAlerts}
            </div>
            <p className="mt-1 text-xs text-slate-500">Open investigations and escalations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Flag rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {loading || !metrics ? '—' : `${(kpis.fraudRate * 100).toFixed(1)}%`}
            </div>
            <p className="mt-1 text-xs text-slate-500">Flagged vs. total volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Average score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900">
              {loading || !metrics ? '—' : kpis.avgScore.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Uncalibrated model scores across alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Flag rate trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {metrics?.fraudRateSeries?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.fraudRateSeries} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) => value.slice(5, 10)}
                    stroke="#94A3B8"
                  />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    domain={[0, 1]}
                    stroke="#94A3B8"
                  />
                  <Tooltip
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    labelFormatter={(label) => `Day ${label.slice(0, 10)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="fraudRate"
                    stroke="#0F172A"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {loading ? 'Loading chart…' : 'No flag rate data yet'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top risky merchants</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.topMerchants?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead className="text-right">Avg score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topMerchants.map((merchant) => (
                    <TableRow key={merchant.merchantId}>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-900">
                          {merchant.merchantName}
                        </div>
                        <div className="text-xs text-slate-500">{merchant.alertCount} alerts</div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {merchant.avgScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-slate-500">
                {loading ? 'Loading merchant risk…' : 'No merchant risk data yet'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
