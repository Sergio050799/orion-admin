import { NextResponse } from 'next/server';
import { getAudit } from '@/lib/api';

export async function GET(req: Request) {
  const url     = new URL(req.url);
  const limit   = url.searchParams.get('limit')   || '100';
  const offset  = url.searchParams.get('offset')  || '0';
  const usuario = url.searchParams.get('usuario') || '';
  const fecha   = url.searchParams.get('fecha')   || '';

  try {
    const data = await getAudit({
      limit: Number(limit),
      offset: Number(offset),
      usuario: usuario || undefined,
      fecha: fecha || undefined,
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ rows: [], total: 0 });
  }
}
