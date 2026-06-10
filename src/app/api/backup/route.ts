import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    const assets = await prisma.asset.findMany();
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
    const employees = await prisma.employee.findMany();
    const licenses = await prisma.license.findMany();
    const logs = await prisma.log.findMany();
    const servers = await prisma.server.findMany();
    const tickets = await prisma.ticket.findMany();
    const transfers = await prisma.assetTransfer.findMany();
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        assets,
        users,
        employees,
        licenses,
        logs,
        servers,
        tickets,
        transfers
      }
    };
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="system_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Помилка генерації бекапу:', error);
    return NextResponse.json({ error: 'Помилка генерації резервної копії' }, { status: 500 });
  }
}
