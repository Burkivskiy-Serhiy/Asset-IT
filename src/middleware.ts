import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    if (
      (path.startsWith("/settings") || path.startsWith("/security")) &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      (path.startsWith("/monitoring") || path.startsWith("/employees")) &&
      role !== "admin" &&
      role !== "tech"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    
    return NextResponse.next();
  },
  {
    callbacks: {
      
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/assets/:path*",
    "/monitoring/:path*",
    "/helpdesk/:path*",
    "/employees/:path*",
    "/security/:path*",
    "/settings/:path*",
  ],
};