import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/sheets';
import { cacheGet, cacheSet } from '@/lib/cache';
import type { UserProfile } from '@/types';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email parameter required' }, { status: 400 });

  try {
    const key = `user:${email.toLowerCase()}`;
    const cached = cacheGet<UserProfile>(key);
    const data = cached ?? await getUserProfile(email);
    if (!cached && data) cacheSet(key, data);
    if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
