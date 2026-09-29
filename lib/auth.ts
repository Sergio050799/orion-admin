import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'orion_admin_token';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change_me_in_production');

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function getSession(): Promise<{ admin: boolean } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { admin: boolean };
  } catch {
    return null;
  }
}

export { COOKIE };
