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

    // 1. Open Tickets
    const tickets = await sql`SELECT id FROM tickets WHERE status != 'Вирішено' AND status != 'Закрито'`;
    const openTickets = tickets.length;

    // 2. Overdue Maintenance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maintenance = await prisma.maintenanceTask.findMany({
      where: {
        status: { not: 'Виконано' },
        scheduledAt: { lt: today }
      }
    });
    const overdueMaintenance = maintenance.length;

    // 3. Expiring Licenses (<= 30 days)
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

    // 4. Expiring Warranties (<= 30 days)
    const warranties = await prisma.asset.findMany({
      where: {
        warrantyExpires: {
          lte: thirtyDaysFromNow,
          gte: today
        }
      }
    });
    const expiringWarranties = warranties.length;

    // 5. Offline Servers
    const servers = await sql`SELECT id FROM servers WHERE status = 'Offline' OR status = 'Critical'`;
    const offlineServers = servers.length;

    const stats = {
      openTickets,
      overdueMaintenance,
      expiringLicenses,
      expiringWarranties,
      offlineServers
    };

    // If everything is perfect, maybe we don't spam. But daily digest is usually expected anyway.
    if (openTickets === 0 && overdueMaintenance === 0 && expiringLicenses === 0 && offlineServers === 0) {
      // Optional: Skip sending if completely clean
      // return NextResponse.json({ success: true, message: "Все ідеально, сповіщення не відправлено" });
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
