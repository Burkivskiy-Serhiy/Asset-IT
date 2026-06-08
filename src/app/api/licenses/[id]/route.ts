import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    return NextResponse.json({ success: true, message: "Ліцензію успішно видалено" });
  } catch (error: any) {
    console.error("Помилка при видаленні ліцензії:", error);
    return NextResponse.json({ error: error.message || "Не вдалося видалити" }, { status: 500 });
  }
}