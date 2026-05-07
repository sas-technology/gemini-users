import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/auth';

const PUBLIC = ['/login', '/api/auth/login', '/api/auth/logout', '/api/health'];

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + '/'));

  if (!isPublic) {
    const secret = process.env.DASHBOARD_SECRET ?? '';
    const cookie = event.cookies.get(COOKIE_NAME);
    if (!secret || cookie !== secret) {
      throw redirect(302, `/login?from=${encodeURIComponent(path)}`);
    }
  }

  return resolve(event);
};
