import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const data = await sql`SELECT * FROM logs ORDER BY "createdAt" DESC LIMIT 50`;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Logs GET Error:', error);
    return NextResponse.json({ error: 'Помилка завантаження логів' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, time, type, source, text, actor } = await req.json();
    
    const logActor = actor || 'Система';

    const result = await sql`
      INSERT INTO logs (id, time, type, source, text, actor)
      VALUES (${id}, ${time}, ${type}, ${source}, ${text}, ${logActor})
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Logs POST Error:', error);
    return NextResponse.json({ error: 'Помилка збереження логу' }, { status: 500 });
  }
}