import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("vial_token");
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ["/admin", "/subscriber", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth routes
  const authRoutes = ["/login", "/signup"];
  const isAuthRoute = authRoutes.includes(pathname);

  // If accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing auth route with token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/subscriber", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/subscriber/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
  ],
};
