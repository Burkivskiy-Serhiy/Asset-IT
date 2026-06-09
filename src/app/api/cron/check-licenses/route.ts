import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendLicenseExpirationAlert } from '@/lib/slack';
import { sendEmailAlert } from '@/lib/email';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: Request) {
  try {
    const licenses = await prisma.license.findMany({
      where: {
        expirationDate: {
          not: null
        }
      }
    });

    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ message: "Налаштування не знайдено" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let notifiedCount = 0;

    for (const license of licenses) {
      if (!license.expirationDate) continue;

      const expDate = new Date(license.expirationDate);
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // We notify EXACTLY at 30, 14, and 7 days.
      if (diffDays === 30 || diffDays === 14 || diffDays === 7) {
        let notified = false;

        // Slack notification
        if (settings.slackNotif && settings.slackWebhook) {
          await sendLicenseExpirationAlert(settings.slackWebhook, license, diffDays);
          notified = true;
        }

        // Email notification
        if (settings.emailNotif && settings.adminEmail) {
          await sendEmailAlert(settings.adminEmail, license, diffDays);
          notified = true;
        }

        if (notified) {
          notifiedCount++;
          // Create an internal system log or ticket could also be added here
          await prisma.log.create({
            data: {
              time: new Date().toISOString(),
              actor: "Система (Cron)",
              type: "Попередження",
              source: "Ліцензії",
              text: `Відправлено сповіщення про закінчення ліцензії "${license.name}" (через ${diffDays} дн.)`
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Перевірка ліцензій завершена",
      notified: notifiedCount
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Внутрішня помилка" }, { status: 500 });
  }
}
