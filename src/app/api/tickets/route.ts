import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const data = await sql`SELECT * FROM tickets ORDER BY "createdAt" DESC`;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tickets GET Error:', error);
    return NextResponse.json({ error: 'Помилка завантаження тікетів' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("=== СТВОРЕННЯ ТІКЕТА ===", body);
    
    const id = body.id || crypto.randomUUID();
    const { title, description, status = 'Відкрито', priority = 'Середній' } = body;
    const user = body.user || 'Користувач';

    const result = await sql`
      INSERT INTO tickets (id, title, description, status, priority, "user", "createdAt", "updatedAt")
      VALUES (${id}, ${title}, ${description}, ${status}, ${priority}, ${user}, NOW(), NOW())
      RETURNING *
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Tickets POST Error:', error);
    return NextResponse.json({ error: 'Помилка створення тікета' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    console.log("=== ОНОВЛЕННЯ ТІКЕТА ===", body);

    const { id, title, description, status, priority, user } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID заявки обовʼязковий для оновлення' }, { status: 400 });
    }

    const currentTicket = await sql`SELECT * FROM tickets WHERE id = ${id}`;
    
    if (currentTicket.length === 0) {
      return NextResponse.json({ error: 'Заявку не знайдено в базі даних' }, { status: 404 });
    }

    const old = currentTicket[0];

    const finalTitle = title !== undefined ? title : old.title;
    const finalDescription = description !== undefined ? description : old.description;
    const finalStatus = status !== undefined ? status : old.status;
    const finalPriority = priority !== undefined ? priority : old.priority;
    const finalUser = user !== undefined ? user : old.user;

    const result = await sql`
      UPDATE tickets
      SET 
        title = ${finalTitle},
        description = ${finalDescription},
        status = ${finalStatus},
        priority = ${finalPriority},
        "user" = ${finalUser},
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Tickets PUT Error:', error);
    return NextResponse.json({ error: 'Помилка оновлення тікета' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return PUT(req);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID тікета не вказано в запиті' }, { status: 400 });
    }

    console.log("=== ВИДАЛЕННЯ ТІКЕТА ===", id);

    const result = await sql`
      DELETE FROM tickets 
      WHERE id = ${id} 
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Тікет із таким ID не знайдено або вже видалено' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Тікет ${id} успішно видалено з бази даних` });
  } catch (error) {
    console.error('Tickets DELETE Error:', error);
    return NextResponse.json({ error: 'Помилка при видаленні тікета' }, { status: 500 });
  }
}