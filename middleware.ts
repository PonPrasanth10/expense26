/**
 * middleware.ts
 * Edge-compatible route guard using auth.config.ts (no Node.js modules).
 * Public routes: /, /login, /signup, /forgot-password, /reset-password, /api/auth/*
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
];

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  const isPublic =
    pathname === "/" ||
    PUBLIC_PATHS.some(
      (path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`))
    );

  // Allow static files and Next.js internals
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/);

  if (isPublic || isStaticFile) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!req.auth?.user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
