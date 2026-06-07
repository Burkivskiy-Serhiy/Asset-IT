import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Перевір, що цей шлях до prisma правильний

export async function GET() {
  try {
    // Звертаємося до правильної моделі "Log", як вказано у schema.prisma
    const logs = await prisma.log.findMany({
      take: 5, // Беремо 5 останніх подій
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Форматуємо дані під інтерфейс нашого дзвіночка
    const notifications = logs.map((log) => {
      // Використовуємо поле time з твоєї бази, або генеруємо з createdAt, якщо воно пусте
      const timeDisplay = log.time || new Date(log.createdAt).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        id: log.id,
        text: log.text || 'Системна подія', // Використовуємо поле text
        time: timeDisplay,
        read: false, 
      };
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Помилка отримання сповіщень:', error);
    
    // Повертаємо заглушку, щоб інтерфейс не падав у разі помилки БД
    return NextResponse.json([
      { id: 'err1', text: 'Журнал подій порожній або недоступний', time: 'Зараз', read: false }
    ]);
  }
}