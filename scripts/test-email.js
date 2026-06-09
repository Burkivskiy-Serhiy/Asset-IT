const nodemailer = require('nodemailer');

async function main() {
  console.log('Створення тестового акаунту Ethereal...');
  // Generate test SMTP service account from ethereal.email
  let testAccount = await nodemailer.createTestAccount();

  console.log('Акаунт створено. Підключення до SMTP...');
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  const licenseName = "Windows 11 Pro Enterprise";
  const daysLeft = 14;
  const expirationDate = new Date(new Date().setDate(new Date().getDate() + daysLeft));

  console.log('Відправка тестового листа...');
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"IT Asset Management" <admin@inform-plan.com>',
    to: "admin@inform-plan.com",
    subject: `🚨 Наближається закінчення ліцензії: ${licenseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #ef4444;">Попередження про закінчення ліцензії</h2>
        <p>Вітаємо!</p>
        <p>Ліцензія для програмного забезпечення/сервісу <strong>${licenseName}</strong> закінчується через <strong>${daysLeft} днів</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Назва:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${licenseName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Дата закінчення:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${expirationDate.toLocaleDateString('uk-UA')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Використано місць:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">10 / 50</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Будь ласка, своєчасно оновіть ліцензію, щоб уникнути блокування роботи.</p>
      </div>
    `,
  });

  console.log("-----------------------------------------");
  console.log("Лист успішно відправлено!");
  console.log("Щоб переглянути, як виглядає цей лист, перейдіть за посиланням:");
  console.log(nodemailer.getTestMessageUrl(info));
  console.log("-----------------------------------------");
}

main().catch(console.error);
