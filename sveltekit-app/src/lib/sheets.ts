import type { UsageData, StudentData, DivisionData, UserProfile } from '$lib/types';

const SCRIPT_URL = () => process.env.APPS_SCRIPT_URL ?? '';
const API_KEY = () => process.env.APPS_SCRIPT_API_KEY ?? '';

async function apsFetch<T>(endpoint: string, extra: Record<string, string> = {}): Promise<T> {
  const scriptUrl = SCRIPT_URL();
  const apiKey = API_KEY();
  if (!scriptUrl) throw new Error('APPS_SCRIPT_URL environment variable is not set');
  if (!apiKey) throw new Error('APPS_SCRIPT_API_KEY environment variable is not set');

  const url = new URL(scriptUrl);
  url.searchParams.set('format', 'json');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('endpoint', endpoint);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    redirect: 'follow',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`Apps Script returned ${res.status}`);
  const data = (await res.json()) as T & { error?: string };
  if (data.error) throw new Error(data.error);
  return data;
}

export function getUsageData(): Promise<UsageData> {
  return apsFetch<UsageData>('usage');
}

export function getStudentData(): Promise<StudentData> {
  return apsFetch<StudentData>('students');
}

export function getDivisionData(): Promise<DivisionData> {
  return apsFetch<DivisionData>('divisions');
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  try {
    return await apsFetch<UserProfile>('user', { email });
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes('not found')) return null;
    throw err;
  }
}
