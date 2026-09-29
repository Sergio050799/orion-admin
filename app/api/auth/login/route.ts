import { NextResponse } from 'next/server';
import { createSessionToken, COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12, // 12 horas
    path: '/',
  });
  return res;
}
