import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/admin/login',
  '/api/admin/login',
  '/setup',
  '/api/admin/setup',
  '/api/admin/check',  // For checking if admin exists
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Admin routes protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Get token from cookie (better for web apps)
    const token = req.cookies.get('adminToken')?.value;
    
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    
    // Optional: Verify token (add this if you want to validate the token)
    // try {
    //   jwt.verify(token, process.env.JWT_SECRET!);
    // } catch (error) {
    //   return NextResponse.redirect(new URL('/admin/login', req.url));
    // }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};