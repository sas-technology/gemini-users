import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, authCookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!verifyPassword(password ?? '')) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const opts = authCookieOptions();
  response.cookies.set(opts);
  return response;
}
