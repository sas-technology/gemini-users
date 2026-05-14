import type { UsageData, StudentData, DivisionData, UserProfile } from '$lib/types';

const SCRIPT_URL = () => process.env.APPS_SCRIPT_URL ?? '';
const API_KEY = () => process.env.APPS_SCRIPT_API_KEY ?? '';

// Result type used by every page load. Lets routes degrade gracefully —
// render a banner when an upstream call fails instead of throwing a 502
// that takes down the whole page.
export type FetchResult<T> = { data: T; error: null } | { data: null; error: string };

function ok<T>(data: T): FetchResult<T> {
  return { data, error: null };
}

function fail<T>(message: string): FetchResult<T> {
  return { data: null, error: message };
}

async function apsFetch<T>(
  endpoint: string,
  extra: Record<string, string> = {}
): Promise<FetchResult<T>> {
  const scriptUrl = SCRIPT_URL();
  const apiKey = API_KEY();
  if (!scriptUrl) return fail('APPS_SCRIPT_URL environment variable is not set');
  if (!apiKey) return fail('APPS_SCRIPT_API_KEY environment variable is not set');

  let res: Response;
  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('endpoint', endpoint);
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);

    res = await fetch(url.toString(), {
      redirect: 'follow',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    return fail(
      `Network error reaching Apps Script: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) return fail(`Apps Script returned ${res.status}`);

  let body: T & { error?: string };
  try {
    body = (await res.json()) as T & { error?: string };
  } catch (err) {
    return fail(
      `Apps Script returned non-JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (body.error) return fail(body.error);
  return ok(body);
}

export function getUsageData(): Promise<FetchResult<UsageData>> {
  return apsFetch<UsageData>('usage');
}

export function getStudentData(): Promise<FetchResult<StudentData>> {
  return apsFetch<StudentData>('students');
}

export function getDivisionData(): Promise<FetchResult<DivisionData>> {
  return apsFetch<DivisionData>('divisions');
}

export async function getUserProfile(email: string): Promise<FetchResult<UserProfile | null>> {
  if (!email) return ok(null);
  const result = await apsFetch<UserProfile>('user', { email });
  if (result.error && result.error.toLowerCase().includes('not found')) return ok(null);
  return result as FetchResult<UserProfile | null>;
}
