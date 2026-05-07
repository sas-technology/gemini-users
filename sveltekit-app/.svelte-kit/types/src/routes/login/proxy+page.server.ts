// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyPassword, cookieOptions, COOKIE_NAME } from '$lib/auth';

export const load = async ({ url, cookies }: Parameters<PageServerLoad>[0]) => {
  const secret = process.env.DASHBOARD_SECRET ?? '';
  if (secret && cookies.get(COOKIE_NAME) === secret) {
    throw redirect(302, url.searchParams.get('from') ?? '/');
  }
  return {};
};

export const actions = {
  default: async ({ request, cookies, url }: import('./$types').RequestEvent) => {
    const data = await request.formData();
    const password = String(data.get('password') ?? '');

    if (!verifyPassword(password)) {
      return fail(401, { error: 'Invalid password. Please try again.' });
    }

    cookies.set(COOKIE_NAME, process.env.DASHBOARD_SECRET!, {
      ...cookieOptions(url.protocol === 'https:'),
    });

    throw redirect(302, url.searchParams.get('from') ?? '/');
  },
};
;null as any as Actions;