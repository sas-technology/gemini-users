import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COOKIE_NAME } from '$lib/auth';

export const POST: RequestHandler = async ({ cookies, url }) => {
  cookies.delete(COOKIE_NAME, {
    path: '/',
    secure: url.protocol === 'https:',
  });
  return json({ ok: true });
};
