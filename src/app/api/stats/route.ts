import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Безпечні запити до таблиці assets без використання неіснуючих колонок brand/model
    const [totalResult, statusResult, categoryResult, recentResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM assets`,
      sql`SELECT status, COUNT(*) as count FROM assets GROUP BY status`,
      sql`SELECT category, COUNT(*) as count FROM assets GROUP BY category`,
      // Сортуємо за часом створення "createdAt" (лапки обов'язкові для CamelCase) і беремо існуючі поля
      sql`SELECT id, name, category, status, "serialNumber" FROM assets ORDER BY "createdAt" DESC LIMIT 5`
    ]);

    // Мапимо отримані активи, розбиваючи name на brand та model для фронтенду
    const formattedRecentAssets = recentResult.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      // Безпечно витягуємо бренд (перше слово з назви), якщо назва є
      brand: asset.name ? asset.name.split(' ')[0] : 'IT',
      // Усе інше записуємо в модель
      model: asset.name ? asset.name.split(' ').slice(1).join(' ') : '-',
      serial_number: asset.serialNumber || 'S/N відсутній'
    }));

    const stats = {
      total: Number(totalResult[0]?.count || 0),
      byStatus: statusResult.reduce((acc: any, row: any) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {}),
      byCategory: categoryResult.reduce((acc: any, row: any) => {
        acc[row.category] = Number(row.count);
        return acc;
      }, {}),
      // Передаємо вже відформатовані активи на фронтенд
      recentAssets: formattedRecentAssets 
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}