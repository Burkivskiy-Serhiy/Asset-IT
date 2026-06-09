export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAction } from '@/lib/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: "ID не надано" }, { status: 400 });
    }

    await prisma.license.delete({
      where: { id: id },
    });

    await logAction('Система', 'warning', 'Ліцензії', `Видалено ліцензію ID: ${id}`);

    return NextResponse.json({ success: true, message: "Ліцензію успішно видалено" });
  } catch (error: any) {
    console.error("Помилка при видаленні ліцензії:", error);
    return NextResponse.json({ error: error.message || "Не вдалося видалити" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: "ID не надано" }, { status: 400 });
    }

    const data = await request.json();
    
    // Convert expirationDate to ISO or null if provided
    let expirationDate = undefined;
    if (data.expirationDate !== undefined) {
      expirationDate = data.expirationDate ? new Date(data.expirationDate).toISOString() : null;
    }

    const updatedLicense = await prisma.license.update({
      where: { id: id },
      data: {
        name: data.name,
        softwareType: data.softwareType,
        licenseKey: data.licenseKey,
        totalSeats: data.totalSeats !== undefined ? parseInt(data.totalSeats, 10) : undefined,
        usedSeats: data.usedSeats !== undefined ? parseInt(data.usedSeats, 10) : undefined,
        expirationDate: expirationDate,
      },
    });

    await logAction('Система', 'info', 'Ліцензії', `Оновлено ліцензію: ${updatedLicense.name}`);

    return NextResponse.json({ success: true, license: updatedLicense });
  } catch (error: any) {
    console.error("Помилка при оновленні ліцензії:", error);
    return NextResponse.json({ error: error.message || "Не вдалося оновити ліцензію" }, { status: 500 });
  }
}