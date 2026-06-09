import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSlackNotification } from '@/lib/slack';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log(`Спроба оновлення активу з ID: ${id}`);

    const body = await req.json();
    const { name, status, category, brand, model, serial_number, specs, assignedTo, location } = body;

    let userToStore = assignedTo || 'Не призначено';
    if (['retired', 'missing'].includes(status)) {
      userToStore = 'Не призначено';
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        type: category || 'Інше',
        status,
        category,
        brand: brand || null,
        model: model || null,
        serialNumber: serial_number || null,
        specs: specs || null,
        user: userToStore,
        location: location || undefined
      }
    });

    try {
      const settingsResult = await prisma.systemSettings.findFirst();
      const settings = settingsResult;

      if (settings && settings.slackNotif && settings.slackWebhook) {
        const payload = {
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🔄 *Оновлено актив:* ${asset.name}\n*Новий статус:* \`${status}\`\n*Користувач:* ${userToStore}`
              }
            }
          ]
        };
        await sendSlackNotification(settings.slackWebhook, payload);
      }
    } catch (slackError) {
      console.error('Помилка відправки Slack (PUT):', slackError);
    }

    const assetWithFrontendFields = {
      ...asset,
      assignedTo: asset.user === 'Не призначено' ? '' : (asset.user || ''),
      serial_number: asset.serialNumber
    };

    return NextResponse.json(assetWithFrontendFields);
  } catch (error: any) {
    console.error('Asset PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log(`Спроба видалення активу з ID: ${id}`);

    const asset = await prisma.asset.delete({
      where: { id }
    });

    try {
      const settingsResult = await prisma.systemSettings.findFirst();
      const settings = settingsResult;

      if (settings && settings.slackNotif && settings.slackWebhook) {
        const payload = {
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🚨 *Увага! Актив видалено з бази!*\n*Назва:* ${asset.name}\n*Категорія:* ${asset.category || 'Не вказано'}\n*ID:* \`${id}\``
              }
            }
          ]
        };
        await sendSlackNotification(settings.slackWebhook, payload);
      }
    } catch (slackError) {
      console.error('Помилка відправки Slack (DELETE):', slackError);
    }

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error: any) {
    console.error('Asset DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete asset' }, { status: 500 });
  }
}