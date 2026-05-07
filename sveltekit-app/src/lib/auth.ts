import type { Cookies } from '@sveltejs/kit';

export const COOKIE_NAME = 'sas-auth';
const SECRET = () => process.env.DASHBOARD_SECRET ?? '';

export function verifyPassword(input: string): boolean {
  const secret = SECRET();
  if (!secret) return false;
  return input === secret;
}

export function isAuthenticated(cookies: Cookies): boolean {
  const secret = SECRET();
  if (!secret) return false;
  return cookies.get(COOKIE_NAME) === secret;
}

export function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8,
    path: '/',
  };
}
