import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Розширюємо структуру об'єкта session.user
   */
  interface Session {
    user: {
      id?: string;
      role?: string; // Додаємо наше поле role
    } & DefaultSession["user"];
  }

  /**
   * Розширюємо структуру об'єкта user, який повертається з бази даних / адаптера
   */
  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Розширюємо структуру JWT токена, якщо ти прокидуєш роль через нього
   */
  interface JWT {
    role?: string;
  }
}