import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const [totalResult, statusResult, categoryResult, recentResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM assets`,
      sql`SELECT status, COUNT(*) as count FROM assets GROUP BY status`,
      sql`SELECT category, COUNT(*) as count FROM assets GROUP BY category`,
      sql`SELECT id, name, category, status, "serialNumber" FROM assets ORDER BY "createdAt" DESC LIMIT 5`
    ]);

    const formattedRecentAssets = recentResult.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      brand: asset.name ? asset.name.split(' ')[0] : 'IT',
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
      recentAssets: formattedRecentAssets 
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}