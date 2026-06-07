import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Singleton для PrismaClient, щоб уникнути переповнення пулу з'єднань в Neon
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. ОТРИМАННЯ ВСІХ РОБІТНИКІВ З ЇХНІМИ РЕАЛЬНИМИ АКТИВАМИ
export async function GET() {
  try {
    // Завантажуємо всіх працівників з бази
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Завантажуємо активи, які закріплені за людьми (без 'null', бо user за схемою обов'язковий String)
    const assets = await prisma.asset.findMany({
      where: {
        user: {
          notIn: ['Не призначено', '']
        }
      }
    });

    // Формуємо фінальний масив для фронтенду
    const employeesWithRealAssets = employees.map(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.trim();

      // Шукаємо техніку, яка належить саме цьому співробітнику
      const assignedAssets = assets
        .filter(asset => asset.user === fullName)
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          category: asset.category,
          brand: asset.brand,
          model: asset.model,
          serial_number: asset.serialNumber
        }));

      // Повертаємо об'єкт у форматі, який очікує твій UI-компонент
      return {
        id: emp.id,
        name: fullName,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: emp.position,     // мапимо position на UI-поле role
        dept: emp.department,   // мапимо department на UI-поле dept
        email: emp.email,
        status: emp.status,
        dateJoined: emp.createdAt,
        assetsList: assignedAssets
      };
    });

    return NextResponse.json(employeesWithRealAssets);
  } catch (error: any) {
    console.error('Помилка отримання працівників через Prisma:', error);
    return NextResponse.json({ error: 'Не вдалося завантажити працівників' }, { status: 500 });
  }
}

// 2. СТВОРЕННЯ НОВОГО РОБІТНИКА
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, role, dept, email, status } = body;

    // Фронтенд шле суцільне поле "name" (напр. "Олександр Коваленко").
    // Ми делікатно розбиваємо його на Ім'я та Прізвище для Prisma-моделі.
    const nameParts = name ? name.trim().split(/\s+/) : ['', ''];
    const firstName = nameParts[0] || 'Співробітник';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Якщо email не ввели, генеруємо унікальну тимчасову заглушку, щоб база не сварилася на @unique
    const fallbackEmail = email || `emp_${Math.random().toString(36).substring(2, 7)}@company.com`;

    const newEmployee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email: fallbackEmail,
        position: role || 'Не вказано',
        department: dept || 'Загальний',
        status: status || 'Активний'
      }
    });

    // Віддаємо фронтенду об'єкт із порожнім масивом техніки (бо людина нова)
    return NextResponse.json({
      id: newEmployee.id,
      name: `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
      role: newEmployee.position,
      dept: newEmployee.department,
      email: newEmployee.email,
      status: newEmployee.status,
      dateJoined: newEmployee.createdAt,
      assetsList: []
    }, { status: 201 });

  } catch (error: any) {
    console.error('Помилка додавання працівника через Prisma:', error);
    return NextResponse.json({ error: error.message || 'Не вдалося створити запис у БД' }, { status: 500 });
  }
}

// 3. ВИДАЛЕННЯ РОБІТНИКА
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID не вказано' }, { status: 400 });
    }

    // КРОК 1: Знаходимо співробітника, щоб дізнатися його повне ім'я
    const emp = await prisma.employee.findUnique({
      where: { id }
    });

    if (emp) {
      const fullName = `${emp.firstName} ${emp.lastName}`.trim();
      
      // КРОК 2: Автоматично відв'язуємо всю його техніку і повертаємо її "На склад"
      await prisma.asset.updateMany({
        where: { user: fullName },
        data: {
          user: 'Не призначено',
          status: 'active'
        }
      });
    }

    // КРОК 3: Видаляємо самого працівника
    await prisma.employee.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Помилка видалення працівника через Prisma:', error);
    return NextResponse.json({ error: error.message || 'Не вдалося видалити з БД' }, { status: 500 });
  }
}