import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassword, cookieOptions, COOKIE_NAME } from '$lib/auth';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  if (!verifyPassword(body.password ?? '')) {
    throw error(401, 'Invalid password');
  }

  cookies.set(COOKIE_NAME, process.env.DASHBOARD_SECRET!, {
    ...cookieOptions(url.protocol === 'https:'),
  });

  return json({ ok: true });
};
