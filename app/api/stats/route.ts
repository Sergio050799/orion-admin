import { NextResponse } from 'next/server';
import { getStats } from '@/lib/api';

const EMPTY_STATS = {
  carpetas: { total: 0, en_estudio: 0, contratadas: 0 },
  corredores: 0,
  usuarios: 0,
  silverdat: { hoy: 0, mes: 0, cache_total: 0 },
  mejoras_pendientes: 0,
  acciones_hoy: 0,
  ultimas_acciones: [],
};

export async function GET() {
  try {
    const data = await getStats();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(EMPTY_STATS);
  }
}
