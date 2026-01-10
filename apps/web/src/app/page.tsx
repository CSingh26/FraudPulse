import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Overview</h3>
        <p className="mt-1 text-sm text-slate-500">Real-time pulse of fraud detection activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {['Active alerts', 'Fraud rate', 'Avg. score'].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-24 rounded bg-slate-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
