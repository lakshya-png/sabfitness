import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("sabfitness_session")?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // Define public auth routes
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth");

  // 1. Requirement 7: Redirect logged-out users to /login
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Requirement 7: Redirect logged-in users to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js, manifest.json
     * - icons, images (static public assets)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|images|api).*)",
  ],
};
