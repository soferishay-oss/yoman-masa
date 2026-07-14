import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    const response = NextResponse.next();
    
    // Pass user info to headers for API routes
    response.headers.set('x-user-id', payload.sub);
    response.headers.set('x-tenant-id', payload.tenantId);
    response.headers.set('x-user-role', payload.role);
    
    return response;
  } catch (error) {
    // Invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/api/:path*'],
};
