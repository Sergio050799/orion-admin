import { NextResponse } from 'next/server';
import { getPrimas, putPrimas } from '@/lib/api';

export async function GET() {
  try {
    const data = await getPrimas();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const result = await putPrimas(body.updates, body.updated_by || 'admin');
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'orion-api no disponible' }, { status: 503 });
  }
}
