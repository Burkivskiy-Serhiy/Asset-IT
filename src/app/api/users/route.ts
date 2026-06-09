import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logAction } from '@/lib/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const formattedUsers = await Promise.all(users.map(async (user) => {
      const lastLog = await prisma.log.findFirst({
        where: { actor: { contains: user.name } },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.createdAt,
        lastActivity: lastLog ? lastLog.time : null
      };
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    console.error('Users GET Error:', error);
    return NextResponse.json({ error: 'Не вдалося завантажити користувачів' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Імʼя, Email та пароль є обовʼязковими' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || 'tech'
      }
    });

    await logAction('Адміністратор', 'info', 'Користувачі', `Створено користувача: ${newUser.name} (${newUser.email})`);

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.createdAt
    }, { status: 201 });

  } catch (error: any) {
    console.error('Users POST Error:', error);
    
    if (error.code === 'P2002' || error.message?.includes('unique constraint')) {
      return NextResponse.json({ error: 'Користувач з таким Email вже існує' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Помилка при створенні користувача' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, role, status, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID є обовʼязковим' }, { status: 400 });
    }

    if (action === 'reset_password') {
      const newPassword = `Tech${Math.floor(Math.random() * 9000) + 1000}!`;
      await prisma.user.update({ where: { id }, data: { password: newPassword } });
      await logAction('Адміністратор', 'warning', 'Користувачі', `Скинуто пароль для користувача ID: ${id}`);
      return NextResponse.json({ newPassword });
    }

    if (role && role !== 'admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin' }
      });

      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true }
      });
      
      if (currentUser?.role === 'admin' && adminCount <= 1) {
        return NextResponse.json(
          { error: 'Неможливо змінити роль. У системі повинен залишатися хоча б один Адміністратор!' }, 
          { status: 400 }
        );
      }
    }

    const dataToUpdate: any = {};
    if (role) dataToUpdate.role = role;
    if (status) dataToUpdate.status = status;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    await logAction('Адміністратор', 'info', 'Користувачі', `Оновлено користувача: ${updatedUser.name} (${updatedUser.email})`);

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status
    });
  } catch (error: any) {
    console.error('Users PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Помилка оновлення' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Не вказано ID користувача' }, { status: 400 });
    }

    const userCheck = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (userCheck?.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin' }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Неможливо видалити користувача. Це останній Адміністратор у системі!' }, 
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    await logAction('Адміністратор', 'warning', 'Користувачі', `Видалено користувача ID: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Users DELETE Error:', error);
    return NextResponse.json({ error: 'Помилка при видаленні користувача' }, { status: 500 });
  }
}