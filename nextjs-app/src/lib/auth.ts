import { cookies } from 'next/headers';

const COOKIE_NAME = 'sas-auth';
const SECRET = process.env.DASHBOARD_SECRET ?? '';

export function verifyPassword(input: string): boolean {
  if (!SECRET) return false;
  return input === SECRET;
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === SECRET;
}

export function authCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: SECRET,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  };
}
