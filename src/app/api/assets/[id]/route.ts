import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSlackNotification } from '@/lib/slack';
import { logAction } from '@/lib/logger';

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log(`Спроба оновлення активу з ID: ${id}`);

    const body = await req.json();
    const { name, status, category, brand, model, serial_number, specs, assignedTo, location, warrantyExpires } = body;

    let userToStore = assignedTo || 'Не призначено';
    if (['retired', 'missing'].includes(status)) {
      userToStore = 'Не призначено';
    }

    const currentAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!currentAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Перевірка на зміни для Журналу переміщень
    const hasUserChanged = currentAsset.user !== userToStore && currentAsset.user !== null;
    const hasLocationChanged = currentAsset.location !== location && currentAsset.location !== null;

    if (hasUserChanged || hasLocationChanged) {
      await prisma.assetTransfer.create({
        data: {
          assetId: id,
          assetName: name,
          fromUser: currentAsset.user,
          toUser: userToStore,
          fromLocation: currentAsset.location,
          toLocation: location || undefined,
          // У реальному додатку performedBy можна брати з сесії (next-auth)
        }
      });
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
        location: location || undefined,
        warrantyExpires: warrantyExpires ? new Date(warrantyExpires) : null
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

    await logAction('Система', 'info', 'Активи', `Оновлено актив: ${asset.name} (${asset.inventoryId || id})`);

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

    await logAction('Система', 'warning', 'Активи', `Видалено актив: ${asset.name} (${id})`);

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error: any) {
    console.error('Asset DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete asset' }, { status: 500 });
  }
}