'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResearchResult, ResearchTransaction } from '@/lib/research-types';

const number = (value: number | null) => value === null ? 'Undefined (one class)' : value.toFixed(3);
const label = (name: string) => name.replace(/_/g, ' ');

function RankingChart({ title, points, x, y }: { title: string; points: { x: number; y: number }[]; x: string; y: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{y} versus {x} · untouched test period</CardDescription></CardHeader><CardContent>
    {points.length ? <ResponsiveContainer width="100%" height={220}><LineChart data={points} margin={{ left: 0, right: 15, bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="x" type="number" domain={[0, 1]} label={{ value: x, position: 'bottom' }} />
      <YAxis domain={[0, 1]} /><Tooltip formatter={(v: number) => v.toFixed(3)} labelFormatter={(v) => `${x}: ${Number(v).toFixed(3)}`} />
      <Line dataKey="y" name={y} type="linear" stroke="#0f766e" dot={false} isAnimationActive={false} />
    </LineChart></ResponsiveContainer> : <p>Ranking metrics require both fraud and legitimate test observations.</p>}
  </CardContent></Card>;
}

export default function ResearchPage() {
  const [csv, setCsv] = useState('');
  const [filename, setFilename] = useState('No CSV selected');
  const [reviewCost, setReviewCost] = useState('2');
  const [falsePositiveCost, setFalsePositiveCost] = useState('5');
  const [lossFraction, setLossFraction] = useState('1');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [selected, setSelected] = useState<ResearchTransaction | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [onlyFlagged, setOnlyFlagged] = useState(true);
  async function analyze(demo: boolean) {
    setBusy(true); setError(''); setResult(null); setSelected(null);
    try {
      if ([reviewCost, falsePositiveCost, lossFraction].some(v => !v.trim() || !Number.isFinite(Number(v)))) throw new Error('Enter finite numeric costs and a loss fraction.');
      const response = await fetch(`/api/research/${demo ? 'demo' : 'analyze'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(demo ? {} : { csv }), review_cost: Number(reviewCost), false_positive_cost: Number(falsePositiveCost), loss_fraction: Number(lossFraction) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Invalid input. Check the CSV schema and nonnegative costs; loss fraction must be 0–1.');
      setResult(data); setSelected(data.transactions.find((t: ResearchTransaction) => t.flagged) ?? data.transactions[0]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Research failed'); }
    finally { setBusy(false); }
  }
  const money = (v: number) => `${result?.metadata.currency ?? ''} ${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return <div className="space-y-6">
    <div><p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Behavioral research</p><h2 className="mt-2 text-3xl font-semibold">Which alerts are worth investigating?</h2>
      <p className="mt-2 max-w-3xl text-slate-600">Compare review burden with missed fraud exposure. Learn an account’s past behavior, choose a threshold on validation data, then examine the later test period.</p></div>
    <Card><CardHeader><CardTitle>1. Supply transactions and investigation economics</CardTitle><CardDescription>Upload settled, labeled transactions in one reporting currency. CSV is analyzed in memory and is not persisted by this workflow.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <label className="block text-sm font-medium">Transaction CSV (maximum 2 MB / 10,000 rows)
          <input className="mt-2 block w-full rounded border p-2" type="file" accept=".csv,text/csv" onChange={async e => {
            const file = e.target.files?.[0]; setResult(null); setSelected(null); setCsv(''); setFilename(file?.name ?? 'No CSV selected'); setError('');
            if (file) { if (file.size > 2000000) setError('CSV exceeds 2 MB'); else setCsv(await file.text()); }
          }} /></label>
        <p className="text-xs text-slate-500">{filename}. Required columns: transaction_id, account_id, timestamp, amount, currency, category, country, label. At least 50 rows / 10 timestamps. ISO timestamps require timezone; labels 0/1.</p>
        <div className="grid gap-4 md:grid-cols-3">{[
          ['Review cost per flag', reviewCost, setReviewCost], ['Additional false-positive cost', falsePositiveCost, setFalsePositiveCost], ['Missed fraud loss fraction (0–1)', lossFraction, setLossFraction],
        ].map(([title, value, setter]) => <label key={title as string} className="text-sm font-medium">{title as string}<input className="mt-1 w-full rounded border p-2" type="number" min="0" step="any" value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)} /></label>)}</div>
        <p className="text-xs text-slate-500">Costs use the CSV reporting currency. Changing assumptions requires a new experiment; no test threshold is tuned interactively.</p>
        <div className="flex flex-wrap gap-3"><button disabled={busy || !csv} onClick={() => analyze(false)} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-40">Analyze my CSV</button>
          <button disabled={busy} onClick={() => analyze(true)} className="rounded border border-teal-700 px-4 py-2 text-teal-800 disabled:opacity-40">Run labeled DEMO DATA</button></div>
        {busy && <p role="status">Fitting historical behavior and evaluating later transactions…</p>}{error && <p role="alert" className="text-rose-700">{error}</p>}
      </CardContent></Card>
    {result && <>
      <div className="rounded border border-teal-200 bg-teal-50 p-4 text-sm"><strong>{result.metadata.source}</strong> · {result.metadata.rows} transactions · {result.metadata.currency}. Scores support research review; they are not calibrated probabilities or proof of fraud.</div>
      <div><h3 className="text-xl font-semibold">2. What happened in the later test period?</h3><p className="text-sm text-slate-500">The threshold {result.threshold > 1 ? '(allow all)' : result.threshold.toFixed(3)} was selected using validation costs only.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{[
        ['Investigations', `${result.test.flagged} / ${result.metadata.split_counts.test}`, 'Transactions exceeding the selected threshold.'],
        ['Missed fraud exposure', money(result.test.missed_fraud_amount), 'Total amount of labeled fraud below threshold, before loss fraction.'],
        ['Scenario cost', money(result.test.cost), 'Reviews + false-positive friction + missed loss. This is not realized savings.'],
      ].map(([title, value, detail]) => <Card key={title}><CardHeader><CardDescription>{title}</CardDescription><CardTitle>{value}</CardTitle></CardHeader><CardContent className="text-sm text-slate-500">{detail}</CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle>Detection quality and economics</CardTitle><CardDescription>An always-legitimate classifier can look accurate while missing every fraud.</CardDescription></CardHeader><CardContent className="overflow-x-auto">
        <table className="w-full text-left text-sm"><thead><tr>{['Policy', 'Precision', 'Recall', 'FP / FN', 'Cost'].map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{[['Selected', result.test], ['Always allow', result.baselines.allow_all], ['Always review', result.baselines.review_all]].map(([name, metric]) => {
          const m = metric as ResearchResult['test']; return <tr key={name as string} className="border-t"><td className="p-2">{name as string}</td><td className="p-2">{number(m.precision)}</td><td className="p-2">{number(m.recall)}</td><td className="p-2">{m.confusion_matrix.fp} / {m.confusion_matrix.fn}</td><td className="p-2">{money(m.cost)}</td></tr>;
        })}</tbody></table>
        <p className="mt-4 text-sm">Test ROC-AUC: <strong>{number(result.test.roc_auc)}</strong> · PR-AUC (trapezoid): <strong>{number(result.test.pr_auc)}</strong> · Average precision: <strong>{number(result.test.average_precision)}</strong> · Fraud prevalence: <strong>{(100 * result.test.prevalence).toFixed(1)}%</strong></p>
        <p className="mt-2 text-xs text-slate-500">Precision is the fraud share of reviews; recall is the fraction of labeled fraud found. Average precision weights precision by recall increments; it differs from trapezoidal PR-AUC.</p>
      </CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2"><RankingChart title="ROC curve" points={result.curves.roc} x="False positive rate" y="Recall" /><RankingChart title="Precision–recall curve" points={result.curves.pr} x="Recall" y="Precision" /></div>
      <Card><CardHeader><CardTitle>3. Investigate individual transactions</CardTitle><CardDescription>Sorted by score. Select a transaction to inspect its prior behavior and signed evidence.</CardDescription></CardHeader><CardContent>
        <label className="text-sm"><input type="checkbox" checked={onlyFlagged} onChange={e => setOnlyFlagged(e.target.checked)} /> Show flagged only</label>
        <div className="mt-3 max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{['Transaction', 'Amount', 'Score', 'Decision', 'Settled label'].map(x => <th className="p-2" key={x}>{x}</th>)}</tr></thead><tbody>{result.transactions.filter(t => !onlyFlagged || t.flagged).map(t => <tr key={t.transaction_id} className="border-t"><td className="p-2"><button className="text-teal-700 underline" onClick={() => setSelected(t)}>{t.transaction_id}</button></td><td className="p-2">{money(t.amount)}</td><td className="p-2">{t.score.toFixed(3)}</td><td className="p-2">{t.flagged ? 'Review' : 'Below threshold'}</td><td className="p-2">{t.label ? 'Fraud' : 'Legitimate'}</td></tr>)}</tbody></table></div>
        {onlyFlagged && !result.test.flagged && <p className="py-3 text-sm">No flags at this validation-selected threshold. Clear the filter to inspect scores.</p>}
        {selected && <div className="mt-5 rounded border bg-slate-50 p-4"><h4 className="font-semibold">Evidence: {selected.transaction_id}</h4><p className="text-xs text-slate-500">{selected.account_id} · {selected.timestamp} · {selected.features.history_count} strictly earlier account transactions in 30 days</p>
          <p className="my-3 text-sm">Prior mean: {money(selected.features.prior_mean_amount)} · Prior hour count: {selected.features.velocity_1h} · Amount deviation: {(100 * selected.features.amount_deviation).toFixed(1)}% {selected.features.cold_start ? '· COLD START: no amount baseline' : ''}</p>
          <ul className="grid gap-1 text-sm md:grid-cols-2">{selected.explanation.map(f => <li key={f.name}>{label(f.name)}: <strong>{f.impact > 0 ? '+' : ''}{f.impact.toFixed(3)}</strong> log-odds</li>)}</ul><p className="mt-3 text-xs text-slate-500">Positive contributions raise the fitted score; negative contributions lower it. Contributions are standardized feature × model coefficient, not causal explanations or probability percentage points.</p></div>}
      </CardContent></Card>
      <details className="rounded border p-4"><summary className="cursor-pointer font-semibold">Validation threshold tradeoff and reproducibility</summary><p className="mt-3 text-sm">Up to 53 candidate thresholds, selected by lowest validation cost; ties prefer fewer reviews.</p>
        <div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{['Threshold', 'Flags', 'Precision', 'Recall', 'Validation cost'].map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{result.validation_thresholds.map(r => <tr key={r.threshold} className="border-t"><td className="p-2">{r.threshold > 1 ? 'Allow all' : r.threshold.toFixed(4)}</td><td>{r.flagged}</td><td>{number(r.precision)}</td><td>{number(r.recall)}</td><td>{money(r.cost)}</td></tr>)}</tbody></table></div>
        {Object.entries(result.metadata.periods).map(([name, period]) => <p className="mt-2 text-xs" key={name}>{name}: {period.start} → {period.end} ({result.metadata.split_counts[name]} rows)</p>)}
        <p className="mt-3 break-all text-xs">Normalized input SHA-256: {result.metadata.sha256}</p><ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">{result.metadata.limitations.map(l => <li key={l}>{l}</li>)}</ul>
      </details>
    </>}
  </div>;
}
