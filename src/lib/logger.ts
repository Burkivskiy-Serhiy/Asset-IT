import { prisma } from './prisma';
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
