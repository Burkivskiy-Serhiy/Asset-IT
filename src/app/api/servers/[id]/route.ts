import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log(`Спроба оновлення сервера з ID: ${id}`);

    const body = await req.json();
    const { name, ip, type, status, cpu, ram, uptime } = body;

    const updatedServer = await sql`
      UPDATE servers 
      SET 
        name = ${name}, 
        ip = ${ip}, 
        type = ${type}, 
        status = ${status}, 
        cpu = ${cpu}, 
        ram = ${ram}, 
        uptime = ${uptime}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updatedServer.length === 0) {
      return NextResponse.json({ error: 'Сервер не знайдено' }, { status: 404 });
    }

    return NextResponse.json(updatedServer[0]);
  } catch (error: any) {
    console.error('Server PUT Error:', error);
    return NextResponse.json({ error: 'Помилка оновлення сервера' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log(`Спроба видалення сервера з ID: ${id}`);

    const deletedServer = await sql`
      DELETE FROM servers 
      WHERE id = ${id}
      RETURNING *;
    `;

    if (deletedServer.length === 0) {
      return NextResponse.json({ error: 'Сервер не знайдено' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Сервер успішно видалено' });
  } catch (error: any) {
    console.error('Server DELETE Error:', error);
    return NextResponse.json({ error: 'Помилка видалення сервера' }, { status: 500 });
  }
}