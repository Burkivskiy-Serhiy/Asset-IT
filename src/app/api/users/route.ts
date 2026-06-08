import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.createdAt
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
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'ID та роль є обовʼязковими' }, { status: 400 });
    }

    if (role === 'tech') {
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Users DELETE Error:', error);
    return NextResponse.json({ error: 'Помилка при видаленні користувача' }, { status: 500 });
  }
}