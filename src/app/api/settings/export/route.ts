import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Отримуємо абсолютно всі дані згідно з твоєю схемою Prisma
    const assets = await prisma.asset.findMany();
    const tickets = await prisma.ticket.findMany();
    const employees = await prisma.employee.findMany();
    const systemSettings = await prisma.systemSettings.findFirst();
    const servers = await prisma.server.findMany();
    const logs = await prisma.log.findMany();
    const securityLogs = await prisma.securityLog.findMany();
    const securitySettings = await prisma.securitySettings.findFirst();

    // Формуємо фінальний об'єкт резервної копії
    const backupData = {
      timestamp: new Date().toISOString(),
      systemVersion: '1.0.0',
      database_summary: {
        total_assets: assets.length,
        total_tickets: tickets.length,
        total_employees: employees.length,
        total_servers: servers.length,
      },
      data: {
        systemSettings,
        securitySettings,
        employees,
        assets,
        tickets,
        servers,
        logs,
        securityLogs,
      }
    };

    // Повертаємо файл із правильними заголовками для автоматичного завантаження
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="it-infrastructure-backup-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Помилка при генерації бекапу:', error);
    return NextResponse.json(
      { error: 'Не вдалося згенерувати резервну копію даних' }, 
      { status: 500 }
    );
  }
}