import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    // --- 1. ADMIN ONLY ROUTES ---
    // Налаштування, користувачі та критична безпека
    if (
      path.startsWith("/settings") || 
      path.startsWith("/security") ||
      path.startsWith("/api/users") ||
      (path.startsWith("/api/settings") && req.method !== "GET")
    ) {
      if (role !== "admin") {
        if (path.startsWith("/api/")) {
          return NextResponse.json({ error: "Access Denied: Admin role required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // --- 2. ADMIN & TECH ONLY ROUTES ---
    // Управління інфраструктурою, ліцензіями, персоналом (Role "user" is blocked)
    if (
      path.startsWith("/monitoring") || 
      path.startsWith("/employees") ||
      path.startsWith("/licenses") ||
      path.startsWith("/reports") ||
      path.startsWith("/maintenance") ||
      path.startsWith("/api/licenses") ||
      path.startsWith("/api/reports") ||
      path.startsWith("/api/maintenance") ||
      path.startsWith("/api/employees") ||
      path.startsWith("/api/servers") ||
      path.startsWith("/api/stats") ||
      (path.startsWith("/api/assets") && req.method !== "GET") ||
      (path.startsWith("/api/tickets") && req.method !== "GET" && req.method !== "POST")
    ) {
      if (role !== "admin" && role !== "tech") {
        if (path.startsWith("/api/")) {
          return NextResponse.json({ error: "Access Denied: Tech/Admin role required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
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
  // Захищаємо всі сторінки та API, крім авторизації, публічних cron-джобів та статики
  matcher: [
    '/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|login).*)',
  ],
};