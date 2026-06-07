import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webhookUrl } = body;

    // Перевіряємо, чи нам взагалі передали посилання і чи схоже воно на вебхук Slack
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      return NextResponse.json(
        { error: 'Недійсний або порожній Slack Webhook URL' },
        { status: 400 }
      );
    }

    // Формуємо структуру повідомлення за допомогою Slack Block Kit
    const slackPayload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Перевірка інтеграції',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Привіт! Це повідомлення означає, що твоя система управління ІТ-активами **успішно підключена** до цього каналу Slack. 🚀'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Час перевірки:* ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`
            }
          ]
        }
      ]
    };

    // Відправляємо дані безпосередньо на шлюз Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${errorText}`);
    }

    return NextResponse.json({ success: true, message: 'Тестове сповіщення надіслано!' });
  } catch (error: any) {
    console.error('Помилка відправки в Slack:', error);
    return NextResponse.json(
      { error: error.message || 'Не вдалося відправити повідомлення. Перевірте URL.' },
      { status: 500 }
    );
  }
}