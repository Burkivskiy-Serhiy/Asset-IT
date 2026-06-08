import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 

export async function GET() {
  try {
    const logs = await prisma.log.findMany({
      take: 5, 
      orderBy: {
        createdAt: 'desc',
      },
    });

    const notifications = logs.map((log) => {
      const timeDisplay = log.time || new Date(log.createdAt).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        id: log.id,
        text: log.text || 'Системна подія', 
        time: timeDisplay,
        read: false, 
      };
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Помилка отримання сповіщень:', error);
    
    return NextResponse.json([
      { id: 'err1', text: 'Журнал подій порожній або недоступний', time: 'Зараз', read: false }
    ]);
  }
}