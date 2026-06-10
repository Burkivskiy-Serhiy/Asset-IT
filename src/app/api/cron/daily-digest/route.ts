import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';
import { sendDailyDigest } from '@/lib/slack';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
const sql = neon(process.env.DATABASE_URL!);
export async function GET(req: Request) {
  try {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings || !settings.slackNotif || !settings.slackWebhook) {
      return NextResponse.json({ message: "Slack сповіщення вимкнені або не налаштовані" });
    }
    const tickets = await sql`SELECT id FROM tickets WHERE status != 'Вирішено' AND status != 'Закрито'`;
    const openTickets = tickets.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maintenance = await prisma.maintenanceTask.findMany({
      where: {
        status: { not: 'Виконано' },
        scheduledAt: { lt: today }
      }
    });
    const overdueMaintenance = maintenance.length;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const licenses = await prisma.license.findMany({
      where: {
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: today
        }
      }
    });
    const expiringLicenses = licenses.length;
    const warranties = await prisma.asset.findMany({
      where: {
        warrantyExpires: {
          lte: thirtyDaysFromNow,
          gte: today
        }
      }
    });
    const expiringWarranties = warranties.length;
    const servers = await sql`SELECT id FROM servers WHERE status = 'Offline' OR status = 'Critical'`;
    const offlineServers = servers.length;
    const stats = {
      openTickets,
      overdueMaintenance,
      expiringLicenses,
      expiringWarranties,
      offlineServers
    };
    if (openTickets === 0 && overdueMaintenance === 0 && expiringLicenses === 0 && offlineServers === 0) {
    }
    await sendDailyDigest(settings.slackWebhook, stats);
    return NextResponse.json({ 
      success: true, 
      message: "Daily Digest відправлено",
      stats
    });
  } catch (error: any) {
    console.error("Daily Digest Cron Error:", error);
    return NextResponse.json({ error: "Внутрішня помилка" }, { status: 500 });
  }
}
