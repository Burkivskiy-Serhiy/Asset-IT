import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendWarrantyExpirationAlert } from '@/lib/slack';
import { sendWarrantyEmailAlert } from '@/lib/email';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export async function GET(req: Request) {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        warrantyExpires: {
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
    for (const asset of assets) {
      if (!asset.warrantyExpires) continue;
      const expDate = new Date(asset.warrantyExpires);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 30 || diffDays === 14 || diffDays === 7) {
        let notified = false;
        if (settings.slackNotif && settings.slackWebhook) {
          await sendWarrantyExpirationAlert(settings.slackWebhook, asset, diffDays);
          notified = true;
        }
        if (settings.emailNotif && settings.adminEmail) {
          await sendWarrantyEmailAlert(settings.adminEmail, asset, diffDays);
          notified = true;
        }
        if (notified) {
          notifiedCount++;
          await prisma.log.create({
            data: {
              time: new Date().toISOString(),
              actor: "Система (Cron)",
              type: "Попередження",
              source: "Активи",
              text: `Відправлено сповіщення про закінчення гарантії "${asset.name}" (через ${diffDays} дн.)`
            }
          });
        }
      }
    }
    return NextResponse.json({ 
      success: true, 
      message: "Перевірка гарантій завершена",
      notified: notifiedCount
    });
  } catch (error: any) {
    console.error("Warranty Cron Error:", error);
    return NextResponse.json({ error: "Внутрішня помилка" }, { status: 500 });
  }
}
