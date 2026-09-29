import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ORION_URL    = process.env.ORION_APP_URL          ?? 'http://127.0.0.1:3000';
const ORION_SECRET = process.env.ORION_APP_ADMIN_SECRET ?? '';

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
    const rowCount = Number(formData.get('rowCount') ?? 0);
    formData.delete('rowCount'); // no enviamos esto a Orion

    const res  = await fetch(`${ORION_URL}/api/admin/catalogo`, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    });
    const data = await res.json();

    if (data.ok && rowCount > 0) {
      saveMeta(rowCount, data.version ?? '');
    }

    return NextResponse.json({ ...data, rowCount }, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'Orion no disponible' }, { status: 502 });
  }
}
