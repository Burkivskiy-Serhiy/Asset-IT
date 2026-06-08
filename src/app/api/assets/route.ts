import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbAssets = await prisma.asset.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedAssets = dbAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      brand: asset.name.split(' ')[0] || 'IT', 
      model: asset.name.split(' ').slice(1).join(' ') || '-',
      serial_number: asset.serialNumber,
      specs: '',
      assignedTo: asset.user === 'Не призначено' ? '' : (asset.user || ''),
    }));

    return NextResponse.json(formattedAssets);
  } catch (error) {
    console.error('Помилка при отриманні активів:', error);
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'Назва та категорія є обовʼязковими' }, { status: 400 });
    }

    const generatedInventoryId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const serialToStore = body.serial_number && body.serial_number.trim() !== '' 
      ? body.serial_number 
      : `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newAsset = await prisma.asset.create({
      data: {
        name: `${body.brand} ${body.model} ${body.name}`.trim(),
        category: body.category,
        status: body.status || 'active',
        serialNumber: serialToStore,
        inventoryId: generatedInventoryId,
        price: 0.0,
        location: 'Головний офіс',
        user: body.assignedTo || 'Не призначено', 
      },
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error('Помилка при створенні активу:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Актив з таким серійним номером вже існує в базі' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Не вдалося зберегти актив' }, { status: 500 });
  }
}