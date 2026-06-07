import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Повертаємо маленькі літери для таблиці, бо ми використали @@map("servers")
    const data = await sql`SELECT * FROM servers ORDER BY "createdAt" ASC`;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Servers GET Error:', error);
    return NextResponse.json({ error: 'Помилка завантаження серверів' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, name, ip, type, status, cpu, ram, uptime } = await req.json();
    
    const result = await sql`
      INSERT INTO servers (id, name, ip, type, status, cpu, ram, uptime)
      VALUES (${id}, ${name}, ${ip}, ${type}, ${status}, ${cpu}, ${ram}, ${uptime})
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Servers POST Error:', error);
    return NextResponse.json({ error: 'Помилка створення сервера' }, { status: 500 });
  }
}