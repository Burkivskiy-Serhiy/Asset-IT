import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAction } from '@/lib/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(licenses);
  } catch (error: any) {
    console.error("Помилка бази даних Neon при GET:", error);
    return NextResponse.json({ error: error.message || 'Помилка отримання даних' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Отримано дані для створення:", body);

    const { name, softwareType, licenseKey, totalSeats, expirationDate } = body;

    if (!name) {
      return NextResponse.json({ error: "Назва ПЗ обов'язкова" }, { status: 400 });
    }

    const newLicense = await prisma.license.create({
      data: {
        name,
        softwareType,
        licenseKey: licenseKey || null,
        totalSeats: Number(totalSeats) || 1,
        usedSeats: 0,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
    });

    console.log("Успішно збережено в Neon:", newLicense);
    await logAction('Система', 'info', 'Ліцензії', `Створено ліцензію: ${newLicense.name}`);
    return NextResponse.json(newLicense);
  } catch (error: any) {
    console.error("Критична помилка при збереженні в Neon:", error);
    return NextResponse.json({ error: error.message || 'Помилка створення ліцензії' }, { status: 500 });
  }
}