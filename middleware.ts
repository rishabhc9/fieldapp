import { NextRequest, NextResponse } from 'next/server';

// Inline the cookie name here — do NOT import from adminAuth.ts
// because that file uses Node's crypto module which is unavailable
// in the Edge Runtime where middleware executes.
const ADMIN_COOKIE_NAME = 'admin_session';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  // Always let the login page through
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Just check the cookie exists — full HMAC verification happens
  // inside the API routes and the admin layout, both of which run
  // in the Node.js runtime where crypto is available.
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!cookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}