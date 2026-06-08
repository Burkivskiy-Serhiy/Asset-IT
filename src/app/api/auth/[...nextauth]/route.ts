import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import crypto from "crypto";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const cleanEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        try {
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: cleanEmail,
                mode: 'insensitive'
              }
            }
          });

          if (user) {
           const passwordsMatch = inputPassword === user.password;

            if (passwordsMatch) {
              const logTime = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
              const actorName = user.name || "System Admin";

              try {
                await prisma.log.create({
                  data: {
                    time: logTime,
                    actor: actorName,
                    type: 'Авторизація',
                    source: 'Система безпеки',
                    text: 'Успішний вхід у систему'
                  }
                });
              } catch (logError) {
                console.error("Не вдалося зберегти лог авторизації:", logError);
              }

              return {
                id: user.id.toString(),
                name: actorName,
                email: user.email,
                role: user.role, 
              };
            } else {
              
              try {
                const logTime = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                await prisma.log.create({
                  data: {
                    time: logTime,
                    actor: cleanEmail,
                    type: 'Помилка',
                    source: 'Система безпеки',
                    text: 'Невдала спроба входу: хибний пароль'
                  }
                });
              } catch (e) {}
            }
          } else {
            
            try {
              const logTime = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
              await prisma.log.create({
                data: {
                  time: logTime,
                  actor: 'Гість',
                  type: 'Помилка',
                  source: 'Система безпеки',
                  text: `Спроба входу в неіснуючий акаунт: ${cleanEmail}`
                }
              });
            } catch (e) {}
          }
        } catch (error) {
          console.error("Помилка авторизації:", error);
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };