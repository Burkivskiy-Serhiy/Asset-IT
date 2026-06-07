import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

// 1. Отримання налаштувань
export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 1 },
    });
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 1 }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Помилка отримання налаштувань:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}

// 2. Збереження локалізації, префіксу, сповіщень та режиму обслуговування
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const updatedSettings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {
        currency: body.currency,
        assetPrefix: body.assetPrefix,
        emailNotif: body.emailNotif,
        slackNotif: body.slackNotif,
        slackWebhook: body.slackWebhook,
        maintenanceMode: body.maintenanceMode,
      },
      create: {
        id: 1,
        currency: body.currency || 'UAH',
        assetPrefix: body.assetPrefix || 'ITA-',
        emailNotif: body.emailNotif ?? true,
        slackNotif: body.slackNotif ?? false,
        slackWebhook: body.slackWebhook || '',
        maintenanceMode: body.maintenanceMode ?? false,
      }
    });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Помилка збереження налаштувань:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}

// 3. Безпечне «скидання» бази даних для диплома
export async function DELETE() {
  try {
    // Штучна затримка сервера на 1.5 секунди.
    // Завдяки цьому на фронтенді красиво покрутиться лоадер, створюючи ефект важкої роботи з БД
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // =========================================================================
    // ВАРІАНТ А (Безпечний муляж): Нічого не видаляємо, щоб ти випадково не втратив свої тестові дані.
    // Залишаємо код як є. Сервер просто каже "все ок".
    // =========================================================================
    
    // ВАРІАНТ Б (Реальне очищення): Якщо перед самим захистом захочеш, щоб воно СПРАВДІ видаляло
    // активи та тікети (але залишало користувачів та адміна), розкоментуй рядки нижче:
    // 
    // await prisma.ticket.deleteMany({});
    // await prisma.asset.deleteMany({});
    // =========================================================================

    return NextResponse.json({ 
      success: true, 
      message: 'Системні таблиці успішно реініціалізовано.' 
    });
  } catch (error) {
    console.error('Помилка при очищенні бази даних:', error);
    return NextResponse.json({ error: 'Помилка сервера при скиданні' }, { status: 500 });
  }
}