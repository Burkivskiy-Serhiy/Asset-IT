import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    
    const [
      totalAssetsRes, 
      activeAssetsRes, 
      offlineAssetsRes, 
      activeTicketsRes,
      eventsRes
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM assets`,
      sql`SELECT COUNT(*) as count FROM assets WHERE status = 'active'`,
      sql`SELECT COUNT(*) as count FROM assets WHERE status IN ('missing', 'retired', 'maintenance')`,
      sql`SELECT COUNT(*) as count FROM tickets WHERE status != 'resolved'`,
      sql`SELECT * FROM system_events ORDER BY created_at DESC LIMIT 5`
    ]);

    return NextResponse.json({
      stats: {
        totalDevices: parseInt(totalAssetsRes[0].count, 10),
        activeDevices: parseInt(activeAssetsRes[0].count, 10),
        offlineDevices: parseInt(offlineAssetsRes[0].count, 10),
        activeTickets: parseInt(activeTicketsRes[0].count, 10),
      },
      events: eventsRes
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return NextResponse.json({ 
      stats: { totalDevices: 0, activeDevices: 0, offlineDevices: 0, activeTickets: 0 }, 
      events: [] 
    });
  }
}