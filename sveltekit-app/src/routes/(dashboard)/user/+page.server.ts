import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/sheets';
import { computeUserInsight } from '$lib/insights';

export const load: PageServerLoad = async ({ url }) => {
  const email = url.searchParams.get('email') ?? '';
  if (!email) return { profile: null, email: '', error: null, insight: null };

  const result = await getUserProfile(email);
  return {
    profile: result.data,
    email,
    error: result.error,
    insight: computeUserInsight(result.data),
  };
};
