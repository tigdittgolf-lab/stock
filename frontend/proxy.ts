import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['/login', '/api/health', '/api/auth'];
  
  // Vérifier si c'est une route publique
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Rediriger la racine vers le login (déjà géré dans page.tsx mais sécurité supplémentaire)
  if (pathname === '/') {
    return NextResponse.next(); // Laisser page.tsx gérer la redirection
  }

  // Pour les routes protégées, ajouter des headers
  const response = NextResponse.next();
  response.headers.set('X-Protected-Route', 'true');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};