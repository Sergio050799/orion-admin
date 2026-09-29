import { NextResponse } from 'next/server';
import { getMejoras, putMejora } from '@/lib/api';

export async function GET(req: Request) {
  const url    = new URL(req.url);
  const estado = url.searchParams.get('estado') || '';
  try {
    const data = await getMejoras(estado || undefined);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PUT(req: Request) {
  try {
    const { id, estado } = await req.json();
    const result = await putMejora(id, estado);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'orion-api no disponible' }, { status: 503 });
  }
}
