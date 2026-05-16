import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isAuthenticated = !!session?.user;
  const role = session?.user?.role;

  // Public routes – always accessible
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin/* → ADMIN only
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // /manager/* → MANAGER or ADMIN
  if (
    pathname.startsWith("/manager") &&
    role !== "MANAGER" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // /goals, /check-ins → any authenticated role (already handled above)
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
