-e export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionCookieValue,
} from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));

  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) {
    console.error('ADMIN_PASSWORD env var is not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Constant-time comparison to prevent timing attacks
  let match = false;
  try {
    const a = Buffer.from(password ?? '');
    const b = Buffer.from(correct);
    match = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    match = false;
  }

  if (!match) {
    // Small artificial delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const cookieValue = createAdminSessionCookieValue();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
