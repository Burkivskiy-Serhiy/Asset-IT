import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/logger';

export async function GET() {
  try {
    let settings = await prisma.securitySettings.findUnique({
      where: { id: 1 },
    });
    
    if (!settings) {
      settings = await prisma.securitySettings.create({
        data: { id: 1 }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Помилка отримання налаштувань безпеки:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const updatedSettings = await prisma.securitySettings.upsert({
      where: { id: 1 },
      update: {
        twoFactor: body.twoFactor,
        requirePasswordChange: body.requirePasswordChange,
        complexPasswords: body.complexPasswords,
        googleSso: body.googleSso,
        microsoftSso: body.microsoftSso,
        ssoClientId: body.ssoClientId,
        ssoTenantId: body.ssoTenantId,
      },
      create: {
        id: 1,
        twoFactor: body.twoFactor ?? false,
        requirePasswordChange: body.requirePasswordChange ?? false,
        complexPasswords: body.complexPasswords ?? false,
        googleSso: body.googleSso ?? false,
        microsoftSso: body.microsoftSso ?? false,
        ssoClientId: body.ssoClientId || '',
        ssoTenantId: body.ssoTenantId || '',
      }
    });
    
    await logAction('Адміністратор', 'warning', 'Налаштування', 'Оновлено налаштування безпеки');
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Помилка збереження налаштувань безпеки:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}
