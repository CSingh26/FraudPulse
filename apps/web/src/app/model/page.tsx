'use client';

import { useEffect, useState } from 'react';

import { fetchModelInfo } from '@/lib/api';
import type { ModelInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ModelPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const response = await fetchModelInfo();
        if (active) {
          setModelInfo(response);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load model info');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const metrics = modelInfo?.metrics ?? {};
  const confusion = modelInfo?.confusion_matrix;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Model</h3>
        <p className="mt-1 text-sm text-slate-500">
          Legacy operational scorer. Auto-trained demo artifacts are synthetic; behavioral research is evaluated separately.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-rose-600">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model metadata</CardTitle>
            <CardDescription>Latest trained version details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Version</span>
              <span className="font-medium text-slate-900">
                {loading ? '—' : (modelInfo?.model_version ?? 'Unknown')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Threshold</span>
              <span className="font-medium text-slate-900">
                {loading ? '—' : (modelInfo?.threshold?.toFixed(2) ?? 'Unavailable')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last trained</span>
              <span className="font-medium text-slate-900">
                {loading
                  ? '—'
                  : modelInfo?.trained_at
                    ? new Date(modelInfo.trained_at).toLocaleString()
                    : 'Not trained'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sample size</span>
              <span className="font-medium text-slate-900">
                {loading ? '—' : (modelInfo?.sample_size ?? 'N/A')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chronological holdout metrics</CardTitle>
            <CardDescription>Precision, recall, and ROC-AUC.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {loading ? (
              <div>Loading metrics…</div>
            ) : Object.keys(metrics).length ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Accuracy</span>
                  <span className="font-medium text-slate-900">
                    {(metrics.accuracy ?? 0).toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Precision</span>
                  <span className="font-medium text-slate-900">
                    {(metrics.precision ?? 0).toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recall</span>
                  <span className="font-medium text-slate-900">
                    {(metrics.recall ?? 0).toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ROC-AUC</span>
                  <span className="font-medium text-slate-900">
                    {(metrics.roc_auc ?? 0).toFixed(3)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">No model metrics available yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confusion matrix</CardTitle>
          <CardDescription>Holdout outcomes for fraud detection.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-slate-500">Loading matrix…</div>
          ) : confusion ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Predicted Legit</TableHead>
                  <TableHead>Predicted Fraud</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-slate-700">Actual Legit</TableCell>
                  <TableCell>{confusion.tn}</TableCell>
                  <TableCell>{confusion.fp}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-700">Actual Fraud</TableCell>
                  <TableCell>{confusion.fn}</TableCell>
                  <TableCell>{confusion.tp}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-slate-500">No confusion matrix available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
