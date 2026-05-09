import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Public routes: media files (loaded by browser <img> tags)
  if (pathname.startsWith('/api/media')) {
    return NextResponse.next();
  }

  // Admin auth endpoints (login, logout, refresh)
  if (pathname.startsWith('/api/users')) {
    return NextResponse.next();
  }

  // GraphQL endpoint (optional — enable if you use it)
  if (pathname === '/api/graphql') {
    return NextResponse.next();
  }

  // Allow requests with valid API secret header (web app)
  const apiSecret = request.headers.get('x-api-secret');
  if (apiSecret && apiSecret === process.env.CMS_API_SECRET) {
    return NextResponse.next();
  }

  // Allow requests with Payload session cookie (admin panel users)
  const payloadToken = request.cookies.get('payload-token')?.value;
  if (payloadToken) {
    // Let Payload validate the token downstream
    return NextResponse.next();
  }

  // Block everything else
  return NextResponse.json(
    { errors: [{ message: 'Unauthorized. Valid API secret or session required.' }] },
    { status: 403 }
  );
}

export const config = {
  matcher: ['/api/:path*'],
};
