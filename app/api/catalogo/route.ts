import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ORION_URL    = process.env.ORION_APP_URL          ?? 'http://127.0.0.1:3000';
const ORION_SECRET = process.env.ORION_APP_ADMIN_SECRET ?? '';
// Ruta al directorio data de orion-app. En VPS ambas apps están en el mismo servidor.
const ORION_DATA   = process.env.ORION_DATA_PATH        ?? path.join(process.cwd(), '..', 'orion', 'app', 'data');

const authHeader = () => ({ Authorization: `Bearer ${ORION_SECRET}` });

const META_PATH = path.join(process.cwd(), 'data', 'catalogo-meta.json');

function readMeta(): { count: number; version: string } | null {
  try { return JSON.parse(fs.readFileSync(META_PATH, 'utf-8')); }
  catch { return null; }
}

function saveMeta(count: number, version: string) {
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, JSON.stringify({ count, version }));
}

export async function GET() {
  try {
    const res  = await fetch(`${ORION_URL}/api/admin/versiones`, { headers: authHeader() });
    const data = await res.json();
    return NextResponse.json({ ...data, currentCount: readMeta()?.count ?? null });
  } catch {
    return NextResponse.json({ ok: false, catalogo: [], currentCount: readMeta()?.count ?? null, error: 'Orion no disponible' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rowCount  = Number(formData.get('rowCount') ?? 0);
    const fileInput = formData.get('file') as File | null;

    if (!fileInput) {
      return NextResponse.json({ ok: false, error: 'No se recibió archivo' }, { status: 400 });
    }

    // Escribir directo al filesystem de orion-app (mismo servidor).
    // Evita el proxy HTTP que falla con archivos grandes.
    const fecha = new Date().toISOString().slice(0, 10);
    const dir   = path.join(ORION_DATA, 'catalogo', fecha);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, 'dim_vehiculos.csv');
    const buf  = Buffer.from(await fileInput.arrayBuffer());
    fs.writeFileSync(dest, buf);

    if (rowCount > 0) saveMeta(rowCount, fecha);

    // Señal ligera a orion-app para invalidar su caché en memoria
    try {
      await fetch(`${ORION_URL}/api/admin/clear-cache`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: '{}',
      });
    } catch { /* no crítico: la caché se invalida en el próximo reinicio */ }

    return NextResponse.json({ ok: true, version: fecha, bytes: buf.length, rowCount });
  } catch (e) {
    console.error('[catalogo/POST]', e);
    return NextResponse.json({ ok: false, error: 'Error al guardar catálogo' }, { status: 500 });
  }
}
