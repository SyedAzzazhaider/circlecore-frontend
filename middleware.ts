import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PLATFORM_PREFIXES = [
  "/feed", "/communities", "/events", "/profile",
  "/posts", "/search", "/saved", "/notifications",
  "/billing", "/settings",
];

const AUTH_ONLY_PREFIXES = [
  "/login", "/register", "/forgot-password",
  "/reset-password", "/verify-email", "/oauth-callback", "/two-factor",
];

function hasSession(req: NextRequest): boolean {
  return (
    !!req.cookies.get("cc_access")?.value ||
    !!req.cookies.get("cc_refresh")?.value
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loggedIn = hasSession(req);

  const isPlatform = PLATFORM_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPlatform && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/feed";
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = loggedIn ? "/feed" : "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|fonts|api/).*)"],
};
