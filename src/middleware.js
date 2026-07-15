import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');

export async function middleware(request) {
  // Exclude public paths and static files
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/debug_roles') ||
    pathname.startsWith('/api/debug_promote') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-tenant-id', payload.tenantId);
    requestHeaders.set('x-user-role', payload.role);
    if (payload.groupId) requestHeaders.set('x-group-id', payload.groupId);

    // Redirect admins and staff from root to their respective dashboards
    if (pathname === '/') {
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (payload.role === 'staff') {
        return NextResponse.redirect(new URL('/staff', request.url));
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('JWT Verification failed:', error.message);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}
