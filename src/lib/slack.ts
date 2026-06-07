// lib/slack.ts
export async function sendSlackNotification(webhookUrl: string, payload: any) {
  if (!webhookUrl) {
    console.error("Slack Webhook URL відсутній");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error("Помилка відправки в Slack:", error);
    return false;
  }
}