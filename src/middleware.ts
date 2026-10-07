import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("adn_session");
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};