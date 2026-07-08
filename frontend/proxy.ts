import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/settings", "/dashboard"];
// Routes that are only for unauthenticated users (login, register)
const PUBLIC_ONLY_ROUTES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the route is for public-only (login/register)
  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.includes(pathname);

  // Public routes that both logged-in and non-logged-in users can access
  if (!requiresAuth && !isPublicOnlyRoute) {
    return NextResponse.next();
  }

  // Get the API URL from environment

  if (requiresAuth || isPublicOnlyRoute) {
    try {
      // Get the access token from the Authorization header
      const authHeader = request.headers.get("authorization");
      let accessToken: string | null = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
      }

      // If no token in header, try to get from cookie (for backward compatibility)
      if (!accessToken) {
        const cookieToken = request.cookies.get("accessToken")?.value;
        if (cookieToken) {
          accessToken = cookieToken;
        }
      }

      // For protected routes, check if we have a token
      // Note: We can't fully validate the token here without making an API call
      // So we'll do a lightweight check and rely on the API to reject invalid tokens
      const hasToken = !!accessToken;

      // Handle protected routes - redirect to login if no token
      if (requiresAuth && !hasToken) {
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
        return NextResponse.redirect(loginUrl);
      }

      // For public-only routes, we need to check if user is authenticated
      if (isPublicOnlyRoute && hasToken) {
        // Optional: Validate token with backend (adds latency)
        // For better performance, you can skip this and just redirect
        // based on token presence, but it's less secure

        // If you want to validate, uncomment this:
        /*
        const validateResponse = await fetch(`${apiUrl}/auth/validate`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        const isAuthenticated = validateResponse.ok;
        
        if (isAuthenticated) {
          const returnUrl = request.nextUrl.searchParams.get("returnUrl");
          const homeUrl = new URL(returnUrl || "/", request.url);
          return NextResponse.redirect(homeUrl);
        }
        */

        // Simple approach: redirect to home if token exists
        const returnUrl = request.nextUrl.searchParams.get("returnUrl");
        const homeUrl = new URL(returnUrl || "/", request.url);
        return NextResponse.redirect(homeUrl);
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Token validation error:", error);

      // On error, treat as unauthenticated
      if (requiresAuth) {
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|public).*)"],
};
