import { NextResponse } from 'next/server';
import { getAjustes, putAjustes } from '@/lib/api';

export async function GET() {
  try {
    const data = await getAjustes();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const result = await putAjustes(body.updates);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'orion-api no disponible' }, { status: 503 });
  }
}
