import nodemailer from 'nodemailer';
export async function sendEmailAlert(toEmail: string, license: any, daysLeft: number) {
  if (!toEmail) return false;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn(`[Mock Email] Відсутні SMTP налаштування. Симуляція відправки email на ${toEmail}...`);
    console.log(`[Mock Email] Тема: Попередження! Закінчується ліцензія ${license.name}`);
    console.log(`[Mock Email] Текст: Ліцензія закінчується через ${daysLeft} днів. Дата: ${new Date(license.expirationDate).toLocaleDateString()}`);
    return true; 
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    const mailOptions = {
      from: `"IT Asset Management" <${user}>`,
      to: toEmail,
      subject: `🚨 Наближається закінчення ліцензії: ${license.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #ef4444;">Попередження про закінчення ліцензії</h2>
          <p>Вітаємо!</p>
          <p>Ліцензія для програмного забезпечення/сервісу <strong>${license.name}</strong> закінчується через <strong>${daysLeft} днів</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Назва:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${license.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Дата закінчення:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(license.expirationDate).toLocaleDateString('uk-UA')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Використано місць:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${license.usedSeats} / ${license.totalSeats}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Будь ласка, своєчасно оновіть ліцензію, щоб уникнути блокування роботи.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Помилка відправки Email:", error);
    return false;
  }
}
export async function sendWarrantyEmailAlert(toEmail: string, asset: any, daysLeft: number) {
  if (!toEmail) return false;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn(`[Mock Email] Відсутні SMTP налаштування. Симуляція відправки email на ${toEmail}...`);
    console.log(`[Mock Email] Тема: Попередження! Закінчується гарантія ${asset.name}`);
    console.log(`[Mock Email] Текст: Гарантія закінчується через ${daysLeft} днів. Дата: ${new Date(asset.warrantyExpires).toLocaleDateString()}`);
    return true; 
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    const mailOptions = {
      from: `"IT Asset Management" <${user}>`,
      to: toEmail,
      subject: `🚨 Наближається закінчення гарантії: ${asset.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #ef4444;">Попередження про закінчення гарантії</h2>
          <p>Вітаємо!</p>
          <p>Гарантія на обладнання <strong>${asset.name} (${asset.brand} ${asset.model})</strong> закінчується через <strong>${daysLeft} днів</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Назва:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${asset.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Серійний номер:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${asset.serial_number || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Дата закінчення:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(asset.warrantyExpires).toLocaleDateString('uk-UA')}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Огляньте обладнання та зверніться до сервісного центру до завершення терміну.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Помилка відправки Email:", error);
    return false;
  }
}
