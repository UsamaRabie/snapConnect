import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authRoutes = ["/login", "/register"];
const protectedRoutes = ["/feed", "/explore", "/search", "/messages", "/post", "/profile"];
const apiRoutes = ["/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("refreshToken")?.value;

  if (apiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route));
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-image.png|robots.txt|sitemap.xml|images/|fonts/).*)",
  ],
};
