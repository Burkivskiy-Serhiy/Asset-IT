import { prisma } from './prisma';

/**
 * Global Audit Logger
 * @param actor Хто виконав дію (напр. 'Адміністратор', 'Технік', 'Система')
 * @param type Рівень логу (напр. 'info', 'warning', 'error', 'success')
 * @param source Де відбулася дія (напр. 'Активи', 'Налаштування', 'Користувачі')
 * @param text Опис дії
 */
export async function logAction(
  actor: string,
  type: string,
  source: string,
  text: string
) {
  try {
    await prisma.log.create({
      data: {
        actor,
        type,
        source,
        text,
        time: new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' }),
      }
    });
  } catch (error) {
    console.error('Не вдалося зберегти лог аудиту:', error);
  }
}
