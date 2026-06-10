import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const transfers = await prisma.assetTransfer.findMany({
      orderBy: {
        date: 'desc'
      }
    });
    return NextResponse.json(transfers);
  } catch (error: any) {
    console.error('Transfers GET Error:', error);
    return NextResponse.json({ error: 'Помилка завантаження історії переміщень' }, { status: 500 });
  }
}
