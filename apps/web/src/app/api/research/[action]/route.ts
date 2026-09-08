import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!['analyze', 'demo'].includes(action)) {
    return NextResponse.json({ detail: 'Unknown research action' }, { status: 404 });
  }
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 2_100_000) {
      return NextResponse.json({ detail: 'Upload exceeds 2 MB' }, { status: 413 });
    }
    const response = await fetch(`${process.env.ML_URL ?? 'http://127.0.0.1:8000'}/research/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      signal: AbortSignal.timeout(60000), cache: 'no-store',
    });
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ detail: 'Research service unavailable. Start the ML service and retry.' }, { status: 503 });
  }
}
