import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  // Always allow the login page to load
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSession(cookie)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
