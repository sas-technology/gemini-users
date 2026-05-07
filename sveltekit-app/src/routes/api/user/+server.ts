import { json, error } from '@sveltejs/kit';
import { getUserProfile } from '$lib/sheets';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const email = url.searchParams.get('email') ?? '';
  if (!email) throw error(400, 'email parameter is required');

  try {
    const profile = await getUserProfile(email);
    if (!profile) throw error(404, 'User not found');
    return json(profile);
  } catch (err) {
    if ((err as { status?: number }).status) throw err;
    throw error(502, err instanceof Error ? err.message : 'Failed to fetch user profile');
  }
};
