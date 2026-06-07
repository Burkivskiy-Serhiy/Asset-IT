import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    // 1. Ексклюзивні права АДМІНІСТРАТОРА
    // Сюди має доступ ТІЛЬКИ 'admin'. Техніка і звичайного юзера викидаємо на головну.
    if (
      (path.startsWith("/settings") || path.startsWith("/security")) &&
      role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 2. Права ТЕХНІКА та АДМІНІСТРАТОРА (Спеціалізовані розділи)
    // Доступ до моніторингу та працівників заборонено для звичайного 'user'.
    if (
      (path.startsWith("/monitoring") || path.startsWith("/employees")) &&
      role !== "admin" &&
      role !== "tech"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Сторінки "/", "/assets" та "/helpdesk" доступні для всіх трьох ролей, 
    // оскільки вони не потрапили під обмеження вище.
    
    return NextResponse.next();
  },
  {
    callbacks: {
      // Базовий фейс-контроль: сторінки з matcher доступні ЛИШЕ залогіненим користувачам
      authorized: ({ token }) => !!token,
    },
  }
);

// Вказуємо, які саме сторінки підлягають захисту NextAuth
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