import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  // Public routes: login and auth API endpoints
  const isPublicPath = pathname === '/login' || pathname.startsWith('/api/auth');
  if (isPublicPath) {
    // Only redirect from /login if logged in with a known role and target is not /login
    if (isLoggedIn && pathname === '/login' && role) {
      const dashboardPath = getDashboardPath(role);
      if (dashboardPath && dashboardPath !== '/login') {
        return NextResponse.redirect(new URL(dashboardPath, req.url));
      }
    }
    return NextResponse.next();
  }

  // Require auth for all other routes
  if (!isLoggedIn) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (pathname.startsWith('/dashboard/admin') && !['ADMIN', 'DISPATCHER'].includes(role)) {
    const target = getDashboardPath(role);
    if (target && !pathname.startsWith(target)) {
      return NextResponse.redirect(new URL(target, req.url));
    }
  }

  if (pathname.startsWith('/dashboard/dispatcher') && !['ADMIN', 'DISPATCHER'].includes(role)) {
    const target = getDashboardPath(role);
    if (target && !pathname.startsWith(target)) {
      return NextResponse.redirect(new URL(target, req.url));
    }
  }

  if (pathname.startsWith('/dashboard/driver') && !['DRIVER'].includes(role)) {
    const target = getDashboardPath(role);
    if (target && !pathname.startsWith(target)) {
      return NextResponse.redirect(new URL(target, req.url));
    }
  }

  if (pathname.startsWith('/dashboard/customer') && !['CUSTOMER'].includes(role)) {
    const target = getDashboardPath(role);
    if (target && !pathname.startsWith(target)) {
      return NextResponse.redirect(new URL(target, req.url));
    }
  }

  return NextResponse.next();
});

function getDashboardPath(role?: string): string {
  switch (role) {
    case 'ADMIN':
    case 'DISPATCHER':
      return '/dashboard/admin';
    case 'DRIVER':
      return '/dashboard/driver';
    case 'CUSTOMER':
      return '/dashboard/customer';
    default:
      return '/login';
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
