// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/sheets';
import { error } from '@sveltejs/kit';

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  const email = url.searchParams.get('email') ?? '';
  if (!email) return { profile: null, email: '' };

  try {
    const profile = await getUserProfile(email);
    return { profile, email };
  } catch (err) {
    throw error(502, err instanceof Error ? err.message : 'Failed to load user profile');
  }
};
