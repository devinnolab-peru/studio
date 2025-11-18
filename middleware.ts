import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/leads', '/client-view'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Si es una ruta pública, permitir el acceso sin verificar sesión
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Si está intentando acceder al dashboard sin sesión, redirigir al login
  if (pathname.startsWith('/dashboard') && !session) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si está en la página de login y ya tiene sesión, redirigir al dashboard
  if (pathname === '/' && session) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};

