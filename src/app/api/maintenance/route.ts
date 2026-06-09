import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const tasks = await prisma.maintenanceTask.findMany({
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Помилка отримання завдань ТО:', error);
    return NextResponse.json({ error: 'Не вдалося завантажити завдання' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetId, title, description, scheduledAt, type } = body;

    const newTask = await prisma.maintenanceTask.create({
      data: {
        assetId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        type: type || 'ТО',
        status: 'Заплановано'
      }
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('Помилка створення завдання ТО:', error);
    return NextResponse.json({ error: 'Не вдалося створити завдання' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, completedAt } = body;

    if (!id) return NextResponse.json({ error: 'ID не вказано' }, { status: 400 });

    const updateData: any = { status };
    if (completedAt) updateData.completedAt = new Date(completedAt);
    if (status === 'Виконано' && !completedAt) updateData.completedAt = new Date();

    const updatedTask = await prisma.maintenanceTask.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Помилка оновлення завдання:', error);
    return NextResponse.json({ error: 'Не вдалося оновити запис' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID не вказано' }, { status: 400 });

    await prisma.maintenanceTask.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Помилка видалення завдання:', error);
    return NextResponse.json({ error: 'Не вдалося видалити запис' }, { status: 500 });
  }
}
