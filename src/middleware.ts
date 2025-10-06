import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route configuration for authentication requirements
const ROUTE_CONFIG = {
  // Public routes - no authentication required
  public: [
    '/',
    '/about',
    '/contact',
    '/faq',
    '/guides',
    '/blog',
    '/privacy',
    '/terms',
    '/how-it-works',
    '/how-to-vote',
    '/robots.txt',
    '/sitemap.xml',
    '/login',
    '/api/auth',
    '/api/login',
    '/api/renew-password',
    '/api/version',
  ],
  
  // Player-only routes
  playerOnly: [
    '/tournament/vote',
    '/tournament/players',
    '/tournament/games',
    '/tournament/wheel',
  ],
  
  // Teams admin routes (Firebase auth + teams_admin/super_admin)
  teamsAdmin: [
    '/admin/players',
    '/admin/settings',
    '/admin/teams',
    '/admin/games',
    '/admin/polls',
    '/admin/visits',
  ],
  
  // Full admin routes (Firebase auth + super_admin only)
  fullAdmin: [
    '/admin',
    '/admin/admins',
    '/admin/rules',
    '/admin/seasons',
    '/admin/fix-seasons',
    '/admin/winners',
    '/admin/wheel',
  ],
  
  // Tournament routes - any authenticated user
  tournament: [
    '/tournament',
    '/tournament/rules',
    '/tournament/winners',
  ],
};

// Helper function to check if path matches route pattern
function matchesRoute(path: string, route: string): boolean {
  if (route.includes('*')) {
    const pattern = route.replace('*', '.*');
    return new RegExp(`^${pattern}$`).test(path);
  }
  return path === route || path.startsWith(route + '/');
}

// Helper function to check route access
function checkRouteAccess(pathname: string): {
  requiresAuth: boolean;
  requiredAccess: 'public' | 'player-only' | 'teams-admin' | 'full-admin' | 'any-authenticated';
  redirectTo?: string;
} {
  // Check public routes first
  if (ROUTE_CONFIG.public.some(route => matchesRoute(pathname, route))) {
    return { requiresAuth: false, requiredAccess: 'public' };
  }
  
  // Check full admin routes
  if (ROUTE_CONFIG.fullAdmin.some(route => matchesRoute(pathname, route))) {
    return { 
      requiresAuth: true, 
      requiredAccess: 'full-admin',
      redirectTo: '/login?redirect=' + encodeURIComponent(pathname)
    };
  }
  
  // Check teams admin routes
  if (ROUTE_CONFIG.teamsAdmin.some(route => matchesRoute(pathname, route))) {
    return { 
      requiresAuth: true, 
      requiredAccess: 'teams-admin',
      redirectTo: '/login?redirect=' + encodeURIComponent(pathname)
    };
  }
  
  // Check player-only routes
  if (ROUTE_CONFIG.playerOnly.some(route => matchesRoute(pathname, route))) {
    return { 
      requiresAuth: true, 
      requiredAccess: 'player-only',
      redirectTo: '/login?redirect=' + encodeURIComponent(pathname)
    };
  }
  
  // Check tournament routes (any authenticated)
  if (ROUTE_CONFIG.tournament.some(route => matchesRoute(pathname, route))) {
    return { 
      requiresAuth: true, 
      requiredAccess: 'any-authenticated',
      redirectTo: '/login?redirect=' + encodeURIComponent(pathname)
    };
  }
  
  // Default to public for unknown routes
  return { requiresAuth: false, requiredAccess: 'public' };
}

// Helper function to get auth state from cookies
function getAuthState(request: NextRequest): {
  isAuthenticated: boolean;
  authType?: 'firebase' | 'player';
  role?: string;
  playerName?: string;
} {
  const cookieHeader = request.headers.get('cookie') || '';
  
  // Import the parse function dynamically to avoid issues
  try {
    // Simple cookie parsing for middleware
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    }

    const isAuthenticated = cookies.isAuthenticated === 'true';
    const authType = cookies.authType as 'firebase' | 'player' | undefined;
    const role = cookies.userRole;
    const playerName = cookies.playerName;

    return {
      isAuthenticated,
      authType,
      role,
      playerName,
    };
  } catch (error) {
    console.error('Error parsing auth cookies:', error);
    return { isAuthenticated: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Development mode: skip middleware for all routes to prevent interference
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|js|css|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  const { requiresAuth, requiredAccess, redirectTo } = checkRouteAccess(pathname);
  
  // If route doesn't require auth, continue
  if (!requiresAuth) {
    return NextResponse.next();
  }
  
  // Get auth state from cookies
  const authState = getAuthState(request);
  
  // If not authenticated, redirect to login
  if (!authState.isAuthenticated) {
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check specific access requirements
  switch (requiredAccess) {
    case 'full-admin':
      if (authState.authType !== 'firebase' || !['super_admin'].includes(authState.role || '')) {
        return NextResponse.redirect(new URL('/tournament', request.url));
      }
      break;
      
    case 'teams-admin':
      if (authState.authType !== 'firebase' || !['super_admin', 'teams_admin'].includes(authState.role || '')) {
        return NextResponse.redirect(new URL('/tournament', request.url));
      }
      break;
      
    case 'player-only':
      if (authState.authType !== 'player') {
        return NextResponse.redirect(new URL('/tournament', request.url));
      }
      break;
      
    case 'any-authenticated':
      // Any authenticated user is allowed
      break;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};