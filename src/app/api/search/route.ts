import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL!);
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }
    const term = `%${q}%`;
    const [assets, licenses, tickets] = await Promise.all([
      sql`SELECT id, name, category, "inventoryId" FROM assets WHERE name ILIKE ${term} OR "inventoryId" ILIKE ${term} OR "serialNumber" ILIKE ${term} LIMIT 5`,
      sql`SELECT id, name, "softwareType" FROM licenses WHERE name ILIKE ${term} OR "softwareType" ILIKE ${term} LIMIT 3`,
      sql`SELECT id, title, status FROM tickets WHERE title ILIKE ${term} OR id ILIKE ${term} LIMIT 3`
    ]);
    const results = [
      ...assets.map((a: any) => ({ type: 'asset', id: a.id, title: a.name, subtitle: `${a.category} • ${a.inventoryId}`, url: `/assets?search=${a.inventoryId}` })),
      ...licenses.map((l: any) => ({ type: 'license', id: l.id, title: l.name, subtitle: l.softwareType, url: `/licenses` })),
      ...tickets.map((t: any) => ({ type: 'ticket', id: t.id, title: t.title, subtitle: `Тікет • ${t.status}`, url: `/helpdesk` }))
    ];
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
