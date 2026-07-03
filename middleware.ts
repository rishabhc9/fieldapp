import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  // Simple presence check in middleware (Edge-safe).
  // Full HMAC verification happens in each API route and server layout,
  // which run in the Node.js runtime where crypto is available.
  if (!cookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}